import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { Cart, Product } from '@/models';

interface PopulatedProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images?: string[];
  status: string;
}

function formatCartResponse(cart: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: Array<{ productId: PopulatedProduct | null; quantity: number }>;
}) {
  const activeItems = cart.items
    .filter((item) => item.productId && item.productId.status === 'active')
    .map((item) => {
      const product = item.productId as PopulatedProduct;
      const unitPrice = product.salePrice ?? product.price;
      const lineTotal = unitPrice * item.quantity;
      return {
        productId: product._id,
        product,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

  const subtotal = activeItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    userId: cart.userId,
    items: activeItems,
    itemCount,
    subtotal,
    currency: 'THB',
  };
}

export async function getCart(userId: string) {
  await connectDB();

  let cart = await Cart.findOne({ userId }).populate({
    path: 'items.productId',
    match: { status: 'active' },
    select: 'name slug sku price salePrice stock images status',
  });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return formatCartResponse(cart.toObject() as unknown as Parameters<typeof formatCartResponse>[0]);
}

export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number
) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    throw new AppError('Quantity must be an integer', 400);
  }

  if (quantity <= 0) {
    return removeCartItem(userId, productId);
  }

  const product = await Product.findById(productId).lean();
  if (!product || product.status !== 'active') {
    throw new AppError('Product is unavailable', 404);
  }

  if (quantity > product.stock) {
    throw new AppError(
      `Requested quantity (${quantity}) exceeds available stock (${product.stock})`,
      400
    );
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{ productId, quantity }],
    });
  } else {
    const existingIndex = cart.items.findIndex(
      (item: { productId: mongoose.Types.ObjectId }) =>
        item.productId.toString() === productId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity = quantity;
    } else {
      cart.items.push({ productId: new mongoose.Types.ObjectId(productId), quantity });
    }

    await cart.save();
  }

  return getCart(userId);
}

export async function removeCartItem(userId: string, productId: string) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  await Cart.updateOne(
    { userId },
    { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } }
  );

  return getCart(userId);
}

export async function clearCart(userId: string) {
  await connectDB();

  await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [] } },
    { upsert: true }
  );

  return getCart(userId);
}