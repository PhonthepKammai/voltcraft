import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Brand, Cart, Category, Order, Product, Review, User } from "@/models";
import { recalcProductRating } from "./review.service";

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
const LOGO = (t: string) => `https://placehold.co/240x96?text=${encodeURIComponent(t)}`;
const PASSWORD = "password123";

// [sku, name, slug-suffix, category, brand, price, salePrice|null, stock, image, description, attributes]
const PRODUCTS: [string, string, string, string, string, number, number | null, number, string, string, Record<string, string>][] = [
  ["VC-AC-MSY13", "Mitsubishi Electric Mr.Slim Inverter 12,283 BTU", "mitsubishi-mr-slim-12283", "air-conditioners", "mitsubishi-electric", 23900, 19900, 14, "photo-1628744448840-55bdb2497bd4", "แอร์อินเวอร์เตอร์ ประหยัดไฟเบอร์ 5 เย็นเร็ว เสียงเงียบ", { ขนาดทำความเย็น: "12,283 BTU", ระบบ: "Inverter", สารทำความเย็น: "R32" }],
  ["VC-AC-AR18", "Samsung WindFree Inverter 18,000 BTU", "samsung-windfree-18000", "air-conditioners", "samsung", 29900, 25900, 4, "photo-1615873968403-89e068629265", "แอร์ WindFree ควบคุมผ่าน SmartThings Wi-Fi", { ขนาดทำความเย็น: "18,000 BTU", การเชื่อมต่อ: "Wi-Fi" }],
  ["VC-RF-RT38", "Samsung Twin Cooling Plus 2 ประตู 13.6 คิว", "samsung-twin-cooling-13-6q", "refrigerators", "samsung", 16490, 13990, 9, "photo-1584568694244-14fbdf83bd30", "ตู้เย็นระบบทำความเย็นแยกอิสระ รักษาความสดนาน", { ความจุ: "13.6 คิว", คอมเพรสเซอร์: "Digital Inverter" }],
  ["VC-RF-NRBX421", "Panasonic Prime Fresh+ ช่องแช่แข็งล่าง 13.4 คิว", "panasonic-prime-fresh-13-4q", "refrigerators", "panasonic", 17900, null, 2, "photo-1571175443880-49e1d25b2bc5", "ช่อง Prime Fresh -3°C เก็บเนื้อสดได้นานโดยไม่ต้องละลาย", { ความจุ: "13.4 คิว", ช่องแช่พิเศษ: "Prime Fresh -3°C" }],
  ["VC-TV-OLED55", "LG OLED evo C4 55 นิ้ว 4K Smart TV 120Hz", "lg-oled-evo-c4-55", "smart-tvs", "lg", 45990, 38900, 3, "photo-1593359677879-a4bb92f829d1", "จอ OLED evo ภาพคมชัด รองรับ Dolby Vision และ HDMI 2.1", { ขนาดจอ: "55 นิ้ว", อัตรารีเฟรช: "120Hz" }],
  ["VC-TV-QLED65", "Samsung Crystal UHD 65 นิ้ว 4K Smart TV", "samsung-crystal-uhd-65", "smart-tvs", "samsung", 22900, 19900, 6, "photo-1593359677879-a4bb92f829d1", "ทีวี 4K จอใหญ่ ระบบ Tizen พร้อมแอปสตรีมมิ่ง", { ขนาดจอ: "65 นิ้ว", ความละเอียด: "4K UHD" }],
  ["VC-WM-FV1410", "LG AI DD เครื่องซักผ้าฝาหน้า 10.5 กก.", "lg-ai-dd-front-10-5kg", "washing-machines", "lg", 18900, 15900, 7, "photo-1626806787461-102c1bfaaea1", "มอเตอร์ AI DD ซักสะอาดด้วย TurboWash 360 และ Steam+", { ความจุ: "10.5 กก.", รอบปั่น: "1,400 rpm" }],
  ["VC-KT-NNCD87", "Panasonic เตาอบไมโครเวฟ Inverter 34 ลิตร", "panasonic-microwave-34l", "kitchen-appliances", "panasonic", 11900, 9990, 18, "photo-1585659722983-3a675dabf23d", "ไมโครเวฟ+ย่าง+อบลมร้อน ในเครื่องเดียว", { ความจุ: "34 ลิตร", กำลังไฟ: "1,000W" }],
  ["VC-KT-KSCOM18", "Sharp หม้อหุงข้าวดิจิทัล 1.8 ลิตร", "sharp-rice-cooker-1-8l", "kitchen-appliances", "sharp", 2790, 2290, 25, "photo-1544233726-9f1d2b27be8b", "หม้อในหนา 4 มม. พร้อม 8 โปรแกรมอัตโนมัติ", { ความจุ: "1.8 ลิตร", รับประกัน: "3 ปี" }],
  ["VC-KT-AF55", "Sharp หม้อทอดไร้น้ำมัน 5.5 ลิตร", "sharp-air-fryer-5-5l", "kitchen-appliances", "sharp", 3490, null, 12, "photo-1544233726-9f1d2b27be8b", "ทอดกรอบด้วยลมร้อน ใช้น้ำมันน้อยกว่าเดิมมาก", { ความจุ: "5.5 ลิตร", กำลังไฟ: "1,700W" }],
];

const ADDR = {
  recipient: "Nattapong Srisuk", phone: "089-876-5432", line1: "128/45 Sukhumvit 71 Rd.",
  subdistrict: "Phra Khanong Nuea", district: "Watthana", province: "Bangkok", postalCode: "10110",
};

export async function seedDatabase() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}), Category.deleteMany({}), Brand.deleteMany({}), Product.deleteMany({}),
    Cart.deleteMany({}), Order.deleteMany({}), Review.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const [admin, customer] = await User.insertMany([
    { name: "Somchai Wattana", email: "admin@voltcraft.com", passwordHash, phone: "081-234-5678", roles: ["admin"] },
    { name: ADDR.recipient, email: "customer@voltcraft.com", passwordHash, phone: ADDR.phone, roles: ["customer"], addresses: [{ ...ADDR, label: "บ้าน", isDefault: true }] },
  ]);

  const cats = await Category.insertMany([
    { name: "Air Conditioners", slug: "air-conditioners" }, { name: "Refrigerators", slug: "refrigerators" },
    { name: "Smart TVs", slug: "smart-tvs" }, { name: "Washing Machines", slug: "washing-machines" },
    { name: "Kitchen Appliances", slug: "kitchen-appliances" },
  ]);
  const brands = await Brand.insertMany([
    { name: "Mitsubishi Electric", slug: "mitsubishi-electric", logo: LOGO("Mitsubishi"), sortOrder: 1 },
    { name: "Samsung", slug: "samsung", logo: LOGO("Samsung"), sortOrder: 2 },
    { name: "LG", slug: "lg", logo: LOGO("LG"), sortOrder: 3 },
    { name: "Panasonic", slug: "panasonic", logo: LOGO("Panasonic"), sortOrder: 4 },
    { name: "Sharp", slug: "sharp", logo: LOGO("Sharp"), sortOrder: 5 },
  ]);
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  const brandId = Object.fromEntries(brands.map((b) => [b.slug, b._id]));

  const products = await Product.insertMany(
    PRODUCTS.map(([sku, name, slug, cat, brand, price, sale, stock, img, description, attributes]) => ({
      sku, name, slug, description, categoryId: catId[cat], brandId: brandId[brand], price, stock,
      images: [IMG(img)], attributes,
      sale: sale ? { isActive: true, type: "fixed", value: price - sale } : { isActive: false },
      status: "active",
    }))
  );
  const P = Object.fromEntries(products.map((p) => [p.sku, p]));
  const price = (sku: string) => (PRODUCTS.find((x) => x[0] === sku)![6] ?? PRODUCTS.find((x) => x[0] === sku)![5]);

  const line = (sku: string, quantity: number) => {
    const p = P[sku];
    return { productId: p._id, sku, name: p.name, image: p.images[0], unitPrice: price(sku), quantity, lineTotal: price(sku) * quantity };
  };
  const mk = (orderNo: string, lines: ReturnType<typeof line>[], extra: Record<string, unknown>) => {
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    return { orderNo, customerId: customer._id, items: lines, shippingAddress: ADDR, subtotal, shippingFee: 0, total: subtotal, ...extra };
  };
  const d = (iso: string) => new Date(iso);

  const orders = await Order.insertMany([
    mk("VC-2611-000121", [line("VC-AC-MSY13", 1)], { status: "paid", payment: { method: "stripe", status: "paid", paidAt: d("2026-11-24T09:15:00Z"), stripeSessionId: "cs_test_seed_121" } }),
    mk("VC-2611-000122", [line("VC-WM-FV1410", 1), line("VC-KT-KSCOM18", 1)], { status: "shipped", payment: { method: "stripe", status: "paid", paidAt: d("2026-11-22T14:30:00Z"), stripeSessionId: "cs_test_seed_122" }, shipment: { carrier: "Kerry Express", trackingNo: "KEX-TH-88492011", shippedAt: d("2026-11-23T08:00:00Z") } }),
    mk("VC-2611-000123", [line("VC-KT-NNCD87", 1)], { status: "delivered", payment: { method: "stripe", status: "paid", paidAt: d("2026-11-18T11:05:00Z"), stripeSessionId: "cs_test_seed_123" }, shipment: { carrier: "Flash Express", trackingNo: "TH0145982210A", shippedAt: d("2026-11-18T16:40:00Z"), deliveredAt: d("2026-11-20T10:15:00Z") } }),
    mk("VC-2611-000124", [line("VC-KT-AF55", 2)], { status: "pending", payment: { method: "cod", status: "unpaid" }, note: "โทรก่อนส่ง 30 นาที" }),
    mk("VC-2611-000125", [line("VC-TV-QLED65", 1)], { status: "delivered", payment: { method: "cod", status: "paid", paidAt: d("2026-11-21T13:00:00Z") }, shipment: { carrier: "Kerry Express", trackingNo: "KEX-TH-77120045", shippedAt: d("2026-11-19T09:00:00Z"), deliveredAt: d("2026-11-21T13:00:00Z") } }),
  ]);

  // Make stock consistent with the seeded orders (COD reserves at placement; Stripe once paid).
  for (const o of orders) {
    for (const it of o.items) await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.quantity } });
  }

  await Review.insertMany([
    { productId: P["VC-KT-NNCD87"]._id, customerId: customer._id, orderId: orders[2]._id, rating: 4, comment: "ความจุใหญ่ อบและอุ่นอาหารสม่ำเสมอดี แพ็คกันกระแทกมาแน่นหนา", status: "published" },
    { productId: P["VC-TV-QLED65"]._id, customerId: customer._id, orderId: orders[4]._id, rating: 5, comment: "ภาพสวยมาก ติดตั้งง่าย จ่ายปลายทางสะดวกดี", status: "published", reply: { text: "ขอบคุณที่ไว้วางใจ VoltCraft ครับ", by: admin._id, at: d("2026-11-22T10:30:00Z") } },
  ]);
  await Promise.all([P["VC-KT-NNCD87"], P["VC-TV-QLED65"]].map((p) => recalcProductRating(String(p._id))));

  return {
    counts: { users: 2, categories: cats.length, brands: brands.length, products: products.length, orders: orders.length, reviews: 2 },
    demoAccounts: {
      admin: { email: "admin@voltcraft.com", password: PASSWORD },
      customer: { email: "customer@voltcraft.com", password: PASSWORD },
    },
  };
}
