import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { assertId, optStr, str } from "@/lib/validate";
import { Cart, Order, Product } from "@/models";
import { ORDER_STATUS } from "@/models/sales/Order";
import { getEffectivePrice } from "./product.service";

export type PaymentMethod = "cod";
const SHIPPING_FEE = 0; // ค่าจัดส่ง (บาท)
const round2 = (n: number) => Math.round(n * 100) / 100;

type Line = { productId: Types.ObjectId | string; quantity: number };

// ---------- helpers ----------
function normalizeOrder<T extends { _id?: unknown; shipment?: unknown }>(doc: T) {
  return {
    ...doc,
    ...(doc._id !== undefined && { _id: String(doc._id) }),
    shipment: doc.shipment && typeof doc.shipment === "object" ? doc.shipment : {},
  };
}

// ---------- stock helpers (atomic + rollback on failure) ----------
async function deductStock(lines: Line[]) {
  const done: Line[] = [];
  for (const l of lines) {
    const r = await Product.updateOne(
      { _id: l.productId, stock: { $gte: l.quantity } },
      { $inc: { stock: -l.quantity } }
    );
    if (r.modifiedCount !== 1) {
      await restoreStock(done);
      const p = await Product.findById(l.productId).select("name stock").lean();
      throw conflict(`สินค้า "${p?.name ?? l.productId}" มีไม่พอ (เหลือ ${p?.stock ?? 0})`);
    }
    done.push(l);
  }
}

async function restoreStock(lines: Line[]) {
  await Promise.all(
    lines.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity } }))
  );
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
      if ((e as { code?: number }).code !== 11000) throw e;
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

function parseInputItems(raw: unknown): Array<{ productId: string; quantity: number }> {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw badRequest("ตะกร้าสินค้าว่างเปล่า");
  }

  const merged = new Map<string, number>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      throw badRequest("รูปแบบรายการสินค้าไม่ถูกต้อง");
    }
    const item = entry as Record<string, unknown>;
    const productId = assertId(item.productId, "productId");
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw badRequest("จำนวนสินค้าต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
    }
    merged.set(productId, (merged.get(productId) ?? 0) + qty);
  }

  return Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));
}

// ---------- checkout (COD only) ----------
export async function createCheckout(
  userId: string,
  input: { items?: unknown; shippingAddress?: unknown; paymentMethod?: unknown; note?: unknown }
) {
  const paymentMethod = input.paymentMethod ?? "cod";
  if (paymentMethod !== "cod") {
    throw badRequest("ขณะนี้รองรับเฉพาะการชำระเงินปลายทาง (cod) เท่านั้น");
  }
  const shippingAddress = parseAddress(input.shippingAddress);

  await connectDB();

  let requestedItems: Array<{ productId: string; quantity: number }>;
  if (input.items !== undefined) {
    requestedItems = parseInputItems(input.items);
  } else {
    const cart = await Cart.findOne({ customerId: userId }).lean();
    if (!cart?.items.length) throw badRequest("ตะกร้าสินค้าว่างเปล่า");
    requestedItems = cart.items.map((ci) => ({
      productId: String(ci.productId),
      quantity: ci.quantity,
    }));
  }

  // real-time validation + price snapshot
  const products = await Product.find({
    _id: { $in: requestedItems.map((i) => i.productId) },
  }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = requestedItems.map((ci) => {
    const p = byId.get(ci.productId);
    if (!p || p.status !== "active") {
      throw conflict("มีสินค้าในตะกร้าที่ไม่พร้อมจำหน่ายแล้ว กรุณาตรวจสอบตะกร้า");
    }
    if (p.stock < ci.quantity) {
      throw conflict(`สินค้า "${p.name}" เหลือในสต็อก ${p.stock} ชิ้น`);
    }
    const unitPrice = getEffectivePrice(p);
    return {
      productId: p._id,
      sku: p.sku,
      name: p.name,
      image: p.images?.[0],
      unitPrice,
      quantity: ci.quantity,
      lineTotal: round2(unitPrice * ci.quantity),
    };
  });

  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));

  const order = await createOrderDoc({
    customerId: userId,
    items,
    shippingAddress,
    subtotal,
    shippingFee: SHIPPING_FEE,
    total: round2(subtotal + SHIPPING_FEE),
    status: "pending",
    payment: { method: "cod", status: "unpaid" },
    shipment: {},
    note: optStr(input.note),
  });

  try {
    await deductStock(items);
  } catch (e) {
    await Order.deleteOne({ _id: order._id });
    throw e;
  }

  await Cart.updateOne({ customerId: userId }, { $set: { items: [] } });
  return { paymentMethod: "cod" as const, order: normalizeOrder(order.toObject()) };
}

// ---------- queries ----------
export async function listOrders(user: AuthUser, statusFilter?: string) {
  await connectDB();
  const filter: Record<string, unknown> = user.isAdmin ? {} : { customerId: user.id };
  if (statusFilter) {
    if (!(ORDER_STATUS as readonly string[]).includes(statusFilter)) {
      throw badRequest("status ไม่ถูกต้อง");
    }
    filter.status = statusFilter;
  }
  const q = Order.find(filter).sort({ createdAt: -1 });
  if (user.isAdmin) q.populate("customerId", "name email phone");
  const docs = await q.lean();
  return docs.map(normalizeOrder);
}

// ---------- admin update ----------
const TRANSITIONS: Record<string, string[]> = {
  pending: ["shipped", "cancelled"],
  paid: ["shipped", "cancelled"], // เผื่อออเดอร์เก่าที่เคยเป็น paid
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

  const set: Record<string, unknown> = {};
  const now = new Date();

  const carrier = optStr(payload.shipment?.carrier);
  const trackingNo = optStr(payload.shipment?.trackingNo);
  if (carrier) set["shipment.carrier"] = carrier;
  if (trackingNo) set["shipment.trackingNo"] = trackingNo;

  const next = payload.status as string | undefined;
  if (next !== undefined) {
    if (!(ORDER_STATUS as readonly string[]).includes(next)) {
      throw badRequest("status ไม่ถูกต้อง");
    }
    if (next !== order.status) {
      if (next === "paid") {
        throw badRequest("ออเดอร์ COD ไม่มีสถานะ paid (จะเป็น paid อัตโนมัติเมื่อ delivered)");
      }
      if (!TRANSITIONS[order.status]?.includes(next)) {
        throw badRequest(`เปลี่ยนสถานะจาก ${order.status} เป็น ${next} ไม่ได้`);
      }
      set.status = next;
      if (next === "shipped") set["shipment.shippedAt"] = now;
      if (next === "delivered") {
        set["shipment.deliveredAt"] = now;
        set["payment.status"] = "paid";
        set["payment.paidAt"] = now;
      }
    }
  }
  if (!Object.keys(set).length) throw badRequest("ไม่มีข้อมูลสำหรับแก้ไข");

  const prevStatus = order.status;
  // compare-and-set กันกรณีแอดมิน 2 คนกดยกเลิกพร้อมกันแล้วคืนสต็อกเบิ้ล
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: prevStatus },
    { $set: set },
    { returnDocument: "after" }
  );
  if (!updated) throw conflict("ออเดอร์ถูกอัปเดตโดยผู้อื่นแล้ว กรุณาโหลดใหม่");

  if (set.status === "cancelled") {
    await restoreStock(updated.items);
  }

  const finalDoc = await Order.findById(orderId)
    .populate("customerId", "name email phone")
    .lean();

  return normalizeOrder(finalDoc!);
}