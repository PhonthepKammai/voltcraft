import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";
import { badRequest, conflict, forbidden, notFound } from "@/lib/errors";
import { getStripe } from "@/lib/stripe";
import { assertId, optStr, str } from "@/lib/validate";
import { Cart, Order, Product } from "@/models";
import { ORDER_STATUS } from "@/models/sales/Order";
import { getEffectivePrice } from "./product.service";

export type PaymentMethod = "stripe" | "cod";
const SHIPPING_FEE = 0; // flat shipping in THB; change here if you add shipping later
const round2 = (n: number) => Math.round(n * 100) / 100;

type Line = { productId: Types.ObjectId | string; quantity: number };

// ---------- stock helpers (no transactions needed: each step is atomic, failures roll back) ----------
async function deductStock(lines: Line[]) {
  const done: Line[] = [];
  for (const l of lines) {
    const r = await Product.updateOne({ _id: l.productId, stock: { $gte: l.quantity } }, { $inc: { stock: -l.quantity } });
    if (r.modifiedCount !== 1) {
      await restoreStock(done); // undo what we already took
      const p = await Product.findById(l.productId).select("name stock").lean();
      throw conflict(`สินค้า "${p?.name ?? l.productId}" มีไม่พอ (เหลือ ${p?.stock ?? 0})`);
    }
    done.push(l);
  }
}

async function restoreStock(lines: Line[]) {
  await Promise.all(lines.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity } })));
}

// ---------- order number: VC-YYMM-XXXXXX ----------
function makeOrderNo(now = new Date()) {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `VC-${yy}${mm}-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
}

async function createOrderDoc(data: Record<string, unknown>) {
  for (let i = 0; i < 5; i++) {
    try {
      return await Order.create({ ...data, orderNo: makeOrderNo() });
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e; // only retry orderNo collisions
    }
  }
  throw conflict("สร้างเลขออเดอร์ไม่สำเร็จ กรุณาลองใหม่");
}

function parseAddress(a: unknown) {
  if (!a || typeof a !== "object") throw badRequest("กรุณาระบุที่อยู่จัดส่ง");
  const x = a as Record<string, unknown>;
  return {
    recipient: str(x.recipient, "ชื่อผู้รับ"),
    phone: str(x.phone, "เบอร์โทร"),
    line1: str(x.line1, "ที่อยู่"),
    subdistrict: optStr(x.subdistrict),
    district: optStr(x.district),
    province: str(x.province, "จังหวัด"),
    postalCode: str(x.postalCode, "รหัสไปรษณีย์"),
  };
}

// ---------- checkout ----------
export async function createCheckout(
  userId: string,
  input: { shippingAddress?: unknown; paymentMethod?: unknown; note?: unknown }
) {
  const paymentMethod = input.paymentMethod;
  if (paymentMethod !== "stripe" && paymentMethod !== "cod") throw badRequest("paymentMethod ต้องเป็น 'stripe' หรือ 'cod'");
  const shippingAddress = parseAddress(input.shippingAddress);

  await connectDB();
  const cart = await Cart.findOne({ customerId: userId }).lean();
  if (!cart?.items.length) throw badRequest("ตะกร้าสินค้าว่างเปล่า");

  // real-time validation + price snapshot
  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.productId) } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items = cart.items.map((ci) => {
    const p = byId.get(String(ci.productId));
    if (!p || p.status !== "active") throw conflict("มีสินค้าในตะกร้าที่ไม่พร้อมจำหน่ายแล้ว กรุณาตรวจสอบตะกร้า");
    if (p.stock < ci.quantity) throw conflict(`สินค้า "${p.name}" เหลือในสต็อก ${p.stock} ชิ้น`);
    const unitPrice = getEffectivePrice(p);
    return {
      productId: p._id, sku: p.sku, name: p.name, image: p.images?.[0],
      unitPrice, quantity: ci.quantity, lineTotal: round2(unitPrice * ci.quantity),
    };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));

  const order = await createOrderDoc({
    customerId: userId, items, shippingAddress, subtotal, shippingFee: SHIPPING_FEE, total: round2(subtotal + SHIPPING_FEE),
    status: "pending",
    payment: { method: paymentMethod, status: "unpaid" },
    note: optStr(input.note),
  });

  // ----- COD: reserve stock now, clear cart, done -----
  if (paymentMethod === "cod") {
    try {
      await deductStock(items);
    } catch (e) {
      await Order.deleteOne({ _id: order._id }); // nothing was reserved, drop the orphan
      throw e;
    }
    await Cart.updateOne({ customerId: userId }, { $set: { items: [] } });
    return { paymentMethod: "cod" as const, order: order.toObject() };
  }

  // ----- Stripe: stock + cart are handled after payment is confirmed -----
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        ...items.map((i) => ({
          quantity: i.quantity,
          price_data: { currency: "thb", unit_amount: Math.round(i.unitPrice * 100), product_data: { name: i.name } },
        })),
        ...(SHIPPING_FEE > 0
          ? [{ quantity: 1, price_data: { currency: "thb", unit_amount: Math.round(SHIPPING_FEE * 100), product_data: { name: "ค่าจัดส่ง" } } }]
          : []),
      ],
      metadata: { orderId: String(order._id), orderNo: order.orderNo },
      client_reference_id: String(order._id),
      success_url: `${base}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?checkout=cancelled`,
    });
    order.payment!.stripeSessionId = session.id;
    await order.save();
    return { paymentMethod: "stripe" as const, order: order.toObject(), checkoutUrl: session.url };
  } catch (e) {
    await Order.deleteOne({ _id: order._id });
    throw e;
  }
}

/**
 * Idempotent: safe to call from the webhook AND the verify endpoint, any number of times.
 * The pending -> paid transition is claimed atomically, so stock is deducted exactly once.
 */
export async function confirmStripePayment(sessionId: string, requester?: AuthUser) {
  if (!sessionId) throw badRequest("ต้องระบุ sessionId");
  await connectDB();

  const order = await Order.findOne({ "payment.stripeSessionId": sessionId });
  if (!order) throw notFound("ไม่พบออเดอร์ของ session นี้");
  if (requester && !requester.isAdmin && String(order.customerId) !== requester.id) throw forbidden();

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { order: order.toObject(), paid: false };

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: "pending" },
    { $set: { status: "paid", "payment.status": "paid", "payment.paidAt": new Date() } },
    { new: true }
  );
  if (!claimed) return { order: order.toObject(), paid: true }; // already processed

  try {
    await deductStock(claimed.items);
  } catch (e) {
    // Customer paid but stock ran out in the meantime: cancel and refund automatically.
    await Order.updateOne({ _id: claimed._id }, { $set: { status: "cancelled" } });
    await refundStripe(claimed._id);
    throw e;
  }
  await Cart.updateOne({ customerId: claimed.customerId }, { $set: { items: [] } });
  return { order: claimed.toObject(), paid: true };
}

async function refundStripe(orderId: Types.ObjectId | string) {
  const order = await Order.findById(orderId);
  const sid = order?.payment?.stripeSessionId;
  if (!order || !sid || order.payment?.status !== "paid") return;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sid);
    const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!pi) return;
    await getStripe().refunds.create({ payment_intent: pi });
    order.payment!.status = "refunded";
    await order.save();
  } catch (e) {
    console.error("[refund] failed — refund manually in Stripe dashboard:", order.orderNo, e);
  }
}

// ---------- queries ----------
export async function listOrders(user: AuthUser, statusFilter?: string) {
  await connectDB();
  const filter: Record<string, unknown> = user.isAdmin ? {} : { customerId: user.id };
  if (statusFilter) {
    if (!(ORDER_STATUS as readonly string[]).includes(statusFilter)) throw badRequest("status ไม่ถูกต้อง");
    filter.status = statusFilter;
  }
  const q = Order.find(filter).sort({ createdAt: -1 });
  if (user.isAdmin) q.populate("customerId", "name email phone");
  return q.lean();
}

// ---------- admin update ----------
const TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "shipped", "cancelled"], // "shipped" only valid for COD (checked below)
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function updateOrderAdmin(
  orderIdRaw: string,
  payload: { status?: unknown; shipment?: { carrier?: unknown; trackingNo?: unknown } }
) {
  const orderId = assertId(orderIdRaw, "orderId");
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw notFound("ไม่พบออเดอร์");

  const method = (order.payment?.method ?? "stripe") as PaymentMethod;
  const set: Record<string, unknown> = {};
  const now = new Date();

  const carrier = optStr(payload.shipment?.carrier);
  const trackingNo = optStr(payload.shipment?.trackingNo);
  if (carrier) set["shipment.carrier"] = carrier;
  if (trackingNo) set["shipment.trackingNo"] = trackingNo;

  const next = payload.status as string | undefined;
  if (next !== undefined) {
    if (!(ORDER_STATUS as readonly string[]).includes(next)) throw badRequest("status ไม่ถูกต้อง");
    if (next !== order.status) {
      if (!TRANSITIONS[order.status]?.includes(next)) throw badRequest(`เปลี่ยนสถานะจาก ${order.status} เป็น ${next} ไม่ได้`);
      if (next === "paid" && method === "cod") throw badRequest("ออเดอร์ COD ไม่มีสถานะ paid (จะเป็น paid อัตโนมัติเมื่อ delivered)");
      if (next === "shipped" && order.status === "pending" && method === "stripe") throw badRequest("ออเดอร์ Stripe ต้องชำระเงินก่อนจึงจะจัดส่งได้");
      set.status = next;
      if (next === "shipped") set["shipment.shippedAt"] = now;
      if (next === "delivered") {
        set["shipment.deliveredAt"] = now;
        if (method === "cod") { set["payment.status"] = "paid"; set["payment.paidAt"] = now; }
      }
    }
  }
  if (!Object.keys(set).length) throw badRequest("ไม่มีข้อมูลสำหรับแก้ไข");

  const prevStatus = order.status;
  // compare-and-set on the old status so two admins can't both cancel (and double-restore stock)
  const updated = await Order.findOneAndUpdate({ _id: orderId, status: prevStatus }, { $set: set }, { new: true });
  if (!updated) throw conflict("ออเดอร์ถูกอัปเดตโดยผู้อื่นแล้ว กรุณาโหลดใหม่");

  if (set.status === "paid") {
    // manual "paid" for a Stripe order = same side effects as the webhook
    try {
      await deductStock(updated.items);
    } catch (e) {
      await Order.updateOne({ _id: orderId }, { $set: { status: prevStatus }, $unset: { "payment.paidAt": 1 } });
      await Order.updateOne({ _id: orderId }, { $set: { "payment.status": "unpaid" } });
      throw e;
    }
    await Cart.updateOne({ customerId: updated.customerId }, { $set: { items: [] } });
  }

  if (set.status === "cancelled") {
    const stockWasDeducted = method === "cod" || order.payment?.status === "paid";
    if (stockWasDeducted) await restoreStock(updated.items);
    if (method === "stripe" && order.payment?.status === "paid") await refundStripe(orderId);
  }

  return (await Order.findById(orderId).lean())!;
}
