import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { getStripe } from '@/lib/stripe';
import { AuthUser } from '@/lib/auth';
import { Cart, Order, ORDER_STATUS, Product } from '@/models';

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  subdistrict?: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface UpdateOrderAdminPayload {
  status?: 'shipped' | 'delivered' | 'cancelled';
  shipment?: {
    carrier?: string;
    trackingNo?: string;
  };
}

function generateOrderNo(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `VC-${yy}${mm}-${random}`;
}

export async function createStripeCheckout(
  userId: string,
  shippingAddress: ShippingAddressInput,
  note?: string
) {
  await connectDB();

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.phone ||
    !shippingAddress?.line1 ||
    !shippingAddress?.district ||
    !shippingAddress?.province ||
    !shippingAddress?.postalCode
  ) {
    throw new AppError('Complete shipping address is required', 400);
  }

  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || !cart.items.length) {
    throw new AppError('Your cart is empty', 400);
  }

  const productIds = cart.items.map(
    (item: { productId: mongoose.Types.ObjectId }) => item.productId
  );
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(
    products.map((p) => [p._id.toString(), p])
  );

  const orderItems: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    sku?: string;
    image?: string;
    price: number;
    quantity: number;
    subtotal: number;
  }> = [];

  for (const cartItem of cart.items as Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
  }>) {
    const product = productMap.get(cartItem.productId.toString());
    if (!product || product.status !== 'active') {
      throw new AppError('One or more items in your cart are no longer available', 400);
    }

    if (cartItem.quantity <= 0 || cartItem.quantity > product.stock) {
      throw new AppError(
        `Insufficient stock for "${product.name}" (available: ${product.stock})`,
        400
      );
    }

    const unitPrice = product.salePrice ?? product.price;
    orderItems.push({
      productId: product._id as mongoose.Types.ObjectId,
      name: product.name,
      sku: product.sku,
      image: Array.isArray(product.images) ? product.images[0] : undefined,
      price: unitPrice,
      quantity: cartItem.quantity,
      subtotal: unitPrice * cartItem.quantity,
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;
  const orderNo = generateOrderNo();

  const order = await Order.create({
    orderNo,
    userId,
    items: orderItems,
    subtotal,
    shippingFee,
    total,
    shippingAddress,
    note: note?.trim(),
    status: ORDER_STATUS.PENDING ?? 'pending',
    payment: {
      method: 'stripe',
      status: 'pending',
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'promptpay'],
    currency: 'thb',
    line_items: orderItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'thb',
        unit_amount: Math.round(item.price * 100), // Stripe THB uses satang (x100)
        product_data: {
          name: item.name,
          images: item.image && item.image.startsWith('http') ? [item.image] : undefined,
        },
      },
    })),
    metadata: {
      orderId: order._id.toString(),
      orderNo: order.orderNo,
      userId,
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel?order_id=${order._id.toString()}`,
  });

  order.payment = {
    ...order.payment,
    stripeSessionId: session.id,
  };
  await order.save();

  return {
    order,
    checkoutUrl: session.url,
  };
}

export async function confirmStripePayment(sessionId: string) {
  await connectDB();

  if (!sessionId?.trim()) {
    throw new AppError('Stripe session ID is required', 400);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError(
      `Payment is not completed (current status: ${session.payment_status})`,
      400
    );
  }

  const pendingStatus = ORDER_STATUS.PENDING ?? 'pending';
  const paidStatus = ORDER_STATUS.PAID ?? 'paid';

  // Atomic status transition ensures webhook + client verify never double-deduct stock
  const updatedOrder = await Order.findOneAndUpdate(
    {
      'payment.stripeSessionId': sessionId,
      status: pendingStatus,
    },
    {
      $set: {
        status: paidStatus,
        'payment.status': 'paid',
        'payment.paidAt': new Date(),
        'payment.stripePaymentIntentId':
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id,
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    const existingOrder = await Order.findOne({
      'payment.stripeSessionId': sessionId,
    });

    if (!existingOrder) {
      throw new AppError('Order not found for this Stripe session', 404);
    }

    // Already processed idempotently
    return { order: existingOrder, alreadyProcessed: true };
  }

  // Safely deduct stock for each item
  await Promise.all(
    (
      updatedOrder.items as Array<{
        productId: mongoose.Types.ObjectId;
        quantity: number;
      }>
    ).map((item) =>
      Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      )
    )
  );

  // Clear customer's cart
  await Cart.updateOne({ userId: updatedOrder.userId }, { $set: { items: [] } });

  return { order: updatedOrder, alreadyProcessed: false };
}

export async function listOrders(user: AuthUser, statusFilter?: string) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (user.role === 'customer') {
    query.userId = user.userId;
  }

  if (statusFilter?.trim()) {
    query.status = statusFilter.trim();
  }

  return Order.find(query)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateOrderAdmin(
  orderId: string,
  payload: UpdateOrderAdminPayload
) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const allowedStatuses = new Set(['shipped', 'delivered', 'cancelled']);
  if (payload.status && !allowedStatuses.has(payload.status)) {
    throw new AppError('Status must be one of: shipped, delivered, cancelled', 400);
  }

  const previousStatus = order.status;
  const now = new Date();

  if (payload.shipment) {
    order.shipment = {
      ...order.shipment,
      ...(payload.shipment.carrier !== undefined
        ? { carrier: payload.shipment.carrier.trim() }
        : {}),
      ...(payload.shipment.trackingNo !== undefined
        ? { trackingNo: payload.shipment.trackingNo.trim() }
        : {}),
    };
  }

  if (payload.status) {
    if (previousStatus === 'cancelled' && payload.status !== 'cancelled') {
      throw new AppError('Cancelled orders cannot be transitioned to another status', 400);
    }

    order.status = payload.status;

    if (payload.status === 'shipped') {
      order.shipment = {
        ...order.shipment,
        shippedAt: order.shipment?.shippedAt ?? now,
      };
    } else if (payload.status === 'delivered') {
      order.shipment = {
        ...order.shipment,
        shippedAt: order.shipment?.shippedAt ?? now,
        deliveredAt: order.shipment?.deliveredAt ?? now,
      };
    }
  }

  await order.save();

  // Restore product stock only if transitioning into 'cancelled' from a stock-deducted state
  const stockWasDeducted =
    previousStatus === 'paid' ||
    previousStatus === 'shipped' ||
    previousStatus === 'delivered';

  if (payload.status === 'cancelled' && stockWasDeducted) {
    await Promise.all(
      (
        order.items as Array<{
          productId: mongoose.Types.ObjectId;
          quantity: number;
        }>
      ).map((item) =>
        Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } }
        )
      )
    );
  }

  return order.toObject();
}