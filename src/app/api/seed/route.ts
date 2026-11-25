import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import {
  User,
  Category,
  Brand,
  Product,
  Cart,
  Order,
  Review,
} from '@/models';

async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
}

async function runSeed() {
  await connectMongoDB();

  // Idempotent reset of all collections
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // 1. Seed Users (Admin + Customer)
  const [adminUser, customerUser] = await User.insertMany([
    {
      name: 'Somchai Wattana',
      email: 'admin@voltcraft.com',
      password: 'password123', // Hash via Mongoose pre-save hook or bcrypt in production
      phone: '081-234-5678',
      role: 'admin',
      addresses: [
        {
          recipient: 'Somchai Wattana',
          phone: '081-234-5678',
          line1: '99/88 Chaeng Watthana Rd.',
          subdistrict: 'Bang Talat',
          district: 'Pak Kret',
          province: 'Nonthaburi',
          postalCode: '11120',
        },
      ],
    },
    {
      name: 'Nattapong Srisuk',
      email: 'customer@voltcraft.com',
      password: 'password123',
      phone: '089-876-5432',
      role: 'customer',
      addresses: [
        {
          recipient: 'Nattapong Srisuk',
          phone: '089-876-5432',
          line1: '128/45 Sukhumvit 71 Rd.',
          subdistrict: 'Phra Khanong Nuea',
          district: 'Watthana',
          province: 'Bangkok',
          postalCode: '10110',
        },
      ],
    },
  ]);

  // 2. Seed Categories (5 items)
  const categories = await Category.insertMany([
    { name: 'Air Conditioners', slug: 'air-conditioners' },
    { name: 'Refrigerators', slug: 'refrigerators' },
    { name: 'Smart TVs', slug: 'smart-tvs' },
    { name: 'Washing Machines', slug: 'washing-machines' },
    { name: 'Kitchen Appliances', slug: 'kitchen-appliances' },
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  // 3. Seed Brands (5 items)
  const brands = await Brand.insertMany([
    { name: 'Mitsubishi Electric', slug: 'mitsubishi-electric' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'LG', slug: 'lg' },
    { name: 'Panasonic', slug: 'panasonic' },
    { name: 'Sharp', slug: 'sharp' },
  ]);

  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b._id]));

  // 4. Seed Products (8 Thai electrical appliances priced directly in THB)
  const products = await Product.insertMany([
    {
      sku: 'VC-AC-MSY13',
      name: 'Mitsubishi Electric Mr.Slim Inverter 12,283 BTU',
      slug: 'mitsubishi-mr-slim-inverter-12283-btu',
      description:
        'Dual Barrier Coating inverter air conditioner with Fast Cooling mode and whisper-quiet 19dB indoor airflow.',
      category: catMap['air-conditioners'],
      brand: brandMap['mitsubishi-electric'],
      price: 23900,
      salePrice: 19900,
      images: [
        'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ขนาดทำความเย็น: '12,283 BTU',
        ระบบ: 'Inverter ประหยัดไฟเบอร์ 5',
        สารทำความเย็น: 'R32',
        รับประกันคอมเพรสเซอร์: '5 ปี',
      },
      status: 'active',
      ratingAvg: 4.9,
      ratingCount: 38,
      stock: 14,
    },
    {
      sku: 'VC-RF-RT38',
      name: 'Samsung Twin Cooling Plus 2-Door Refrigerator 13.6 Q',
      slug: 'samsung-twin-cooling-plus-13-6-q',
      description:
        'Independent dual-evaporator cooling preserves fresh produce moisture without odor transfer.',
      category: catMap['refrigerators'],
      brand: brandMap['samsung'],
      price: 16490,
      salePrice: 13990,
      images: [
        'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ขนาดความจุ: '13.6 คิว (384 ลิตร)',
        ระบบคอมเพรสเซอร์: 'Digital Inverter',
        กำลังไฟ: '140W',
        ฉลากประหยัดไฟ: 'เบอร์ 5 (3 ดาว)',
      },
      status: 'active',
      ratingAvg: 4.8,
      ratingCount: 24,
      stock: 9,
    },
    {
      sku: 'VC-TV-OLED55',
      name: 'LG OLED evo C4 55-Inch 4K Smart TV (120Hz)',
      slug: 'lg-oled-evo-c4-55-4k-smart-tv',
      description:
        'Self-lit OLED evo display with Alpha 9 AI Processor Gen7, Dolby Vision, and HDMI 2.1 gaming support.',
      category: catMap['smart-tvs'],
      brand: brandMap['lg'],
      price: 45990,
      salePrice: 38900,
      images: [
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ขนาดหน้าจอ: '55 นิ้ว',
        ความละเอียด: '4K UHD (3840 x 2160)',
        อัตรารีเฟรช: '120Hz',
        กำลังไฟ: '165W',
      },
      status: 'active',
      ratingAvg: 4.9,
      ratingCount: 19,
      stock: 3,
    },
    {
      sku: 'VC-WM-FV1410',
      name: 'LG AI DD Front Load Washing Machine 10.5 kg',
      slug: 'lg-ai-dd-front-load-washer-10-5kg',
      description:
        'Fabric-sensing AI DD motor with TurboWash 360 and hygienic Steam+ allergy cycle.',
      category: catMap['washing-machines'],
      brand: brandMap['lg'],
      price: 18900,
      salePrice: 15900,
      images: [
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ความจุซัก: '10.5 กก.',
        รอบปั่นหมาดสูงสุด: '1,400 รอบ/นาที',
        ระบบซักไอน้ำ: 'Steam+',
        รับประกันมอเตอร์: '10 ปี',
      },
      status: 'active',
      ratingAvg: 4.7,
      ratingCount: 31,
      stock: 7,
    },
    {
      sku: 'VC-KT-NNCD87',
      name: 'Panasonic 34L Inverter Convection Microwave Oven',
      slug: 'panasonic-34l-inverter-convection-microwave',
      description:
        '3-in-1 microwave, grill, and convection oven with Cyclonic Inverter technology.',
      category: catMap['kitchen-appliances'],
      brand: brandMap['panasonic'],
      price: 11900,
      salePrice: 9990,
      images: [
        'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ความจุ: '34 ลิตร',
        กำลังไฟไมโครเวฟ: '1,000W',
        กำลังไฟย่าง: '1,300W',
        ระบบควบคุม: 'Touch Panel + Dial',
      },
      status: 'active',
      ratingAvg: 4.6,
      ratingCount: 15,
      stock: 18,
    },
    {
      sku: 'VC-KT-KSCOM18',
      name: 'Sharp Digital Rice Cooker 1.8L Thick Inner Pot',
      slug: 'sharp-digital-rice-cooker-1-8l',
      description:
        'Computerized fuzzy logic heating with 4mm poly-flon inner pot and 8 automatic cooking presets.',
      category: catMap['kitchen-appliances'],
      brand: brandMap['sharp'],
      price: 2790,
      salePrice: 2290,
      images: [
        'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ความจุ: '1.8 ลิตร',
        กำลังไฟ: '830W',
        โปรแกรมทำอาหาร: '8 โปรแกรม',
        รับประกัน: '3 ปี',
      },
      status: 'active',
      ratingAvg: 4.8,
      ratingCount: 42,
      stock: 25,
    },
    {
      sku: 'VC-AC-AR18',
      name: 'Samsung WindFree Inverter Air Conditioner 18,000 BTU',
      slug: 'samsung-windfree-inverter-18000-btu',
      description:
        'Micro-hole WindFree cooling with SmartThings Wi-Fi control and Tri-Care air filtration.',
      category: catMap['air-conditioners'],
      brand: brandMap['samsung'],
      price: 29900,
      salePrice: 25900,
      images: [
        'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ขนาดทำความเย็น: '18,000 BTU',
        การเชื่อมต่อ: 'Wi-Fi SmartThings',
        ระบบกรองอากาศ: 'Tri-Care Filter',
        ฉลากประหยัดไฟ: 'เบอร์ 5',
      },
      status: 'active',
      ratingAvg: 4.7,
      ratingCount: 12,
      stock: 4,
    },
    {
      sku: 'VC-RF-NRBX421',
      name: 'Panasonic Prime Fresh+ Bottom Freezer 13.4 Q',
      slug: 'panasonic-prime-fresh-bottom-freezer-13-4-q',
      description:
        'Soft-freezing -3°C Prime Fresh compartment locks in freshness without requiring thawing.',
      category: catMap['refrigerators'],
      brand: brandMap['panasonic'],
      price: 17900,
      images: [
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
      ],
      attributes: {
        ขนาดความจุ: '13.4 คิว (380 ลิตร)',
        ช่องแช่พิเศษ: 'Prime Fresh -3°C',
        ระบบกำจัดกลิ่น: 'Ag Clean',
        กำลังไฟ: '135W',
      },
      status: 'active',
      ratingAvg: 4.5,
      ratingCount: 11,
      stock: 2,
    },
  ]);

  // 5. Seed Sample Orders (paid, shipped, delivered — all in THB)
  const orders = await Order.insertMany([
    {
      orderNo: 'VC-2611-000121',
      userId: customerUser._id,
      customerName: customerUser.name,
      items: [
        {
          productId: products[0]._id,
          sku: products[0].sku,
          name: products[0].name,
          image: products[0].images[0],
          unitPrice: 19900,
          quantity: 1,
          lineTotal: 19900,
        },
      ],
      shippingAddress: customerUser.addresses[0],
      subtotal: 19900,
      shippingFee: 0,
      total: 19900,
      status: 'paid',
      payment: {
        method: 'stripe',
        status: 'paid',
        paidAt: new Date('2026-11-24T09:15:00.000Z'),
      },
      shipment: {},
    },
    {
      orderNo: 'VC-2611-000122',
      userId: customerUser._id,
      customerName: 'Kanya Phongphat',
      items: [
        {
          productId: products[3]._id,
          sku: products[3].sku,
          name: products[3].name,
          image: products[3].images[0],
          unitPrice: 15900,
          quantity: 1,
          lineTotal: 15900,
        },
        {
          productId: products[5]._id,
          sku: products[5].sku,
          name: products[5].name,
          image: products[5].images[0],
          unitPrice: 2290,
          quantity: 1,
          lineTotal: 2290,
        },
      ],
      shippingAddress: {
        recipient: 'Kanya Phongphat',
        phone: '086-555-0192',
        line1: '44/12 Ratchadapisek Rd.',
        subdistrict: 'Huai Khwang',
        district: 'Huai Khwang',
        province: 'Bangkok',
        postalCode: '10310',
      },
      subtotal: 18190,
      shippingFee: 0,
      total: 18190,
      status: 'shipped',
      payment: {
        method: 'stripe',
        status: 'paid',
        paidAt: new Date('2026-11-22T14:30:00.000Z'),
      },
      shipment: {
        carrier: 'Kerry Express',
        trackingNo: 'KEX-TH-88492011',
        shippedAt: new Date('2026-11-23T08:00:00.000Z'),
      },
    },
    {
      orderNo: 'VC-2611-000123',
      userId: customerUser._id,
      customerName: 'Preecha Chaiyaporn',
      items: [
        {
          productId: products[4]._id,
          sku: products[4].sku,
          name: products[4].name,
          image: products[4].images[0],
          unitPrice: 9990,
          quantity: 1,
          lineTotal: 9990,
        },
      ],
      shippingAddress: {
        recipient: 'Preecha Chaiyaporn',
        phone: '082-119-4430',
        line1: '88/9 Nimmanhaemin Rd.',
        subdistrict: 'Suthep',
        district: 'Mueang Chiang Mai',
        province: 'Chiang Mai',
        postalCode: '50200',
      },
      subtotal: 9990,
      shippingFee: 150,
      total: 10140,
      status: 'delivered',
      payment: {
        method: 'stripe',
        status: 'paid',
        paidAt: new Date('2026-11-18T11:05:00.000Z'),
      },
      shipment: {
        carrier: 'Flash Express',
        trackingNo: 'TH0145982210A',
        shippedAt: new Date('2026-11-18T16:40:00.000Z'),
        deliveredAt: new Date('2026-11-20T10:15:00.000Z'),
      },
    },
  ]);

  // 6. Seed Reviews (1 replied, 1 awaiting reply)
  const reviews = await Review.insertMany([
    {
      productId: products[0]._id,
      productName: products[0].name,
      userId: customerUser._id,
      customerName: customerUser.name,
      rating: 5,
      comment: 'เย็นเร็วมาก เสียงเงียบสุดๆ ค่าไฟลดลงเห็นได้ชัด จัดส่งตรงเวลาครับ',
      images: [],
      status: 'published',
      reply: {
        text: 'ขอบคุณที่ไว้วางใจ VoltCraft ครับ หากต้องการคำแนะนำเรื่องการล้างแอร์หรือการรับประกัน สามารถติดต่อทีมงานได้ตลอดเวลาครับ',
        at: new Date('2026-11-20T10:30:00.000Z'),
      },
    },
    {
      productId: products[4]._id,
      productName: products[4].name,
      userId: customerUser._id,
      customerName: 'Preecha Chaiyaporn',
      rating: 4,
      comment: 'ความจุใหญ่ อบขนมและอุ่นอาหารสม่ำเสมอดีมาก แพ็คกันกระแทกมาแน่นหนาครับ',
      images: [],
      status: 'published',
    },
  ]);

  return {
    success: true,
    message: 'VoltCraft database seeded successfully (THB pricing).',
    counts: {
      users: 2,
      categories: categories.length,
      brands: brands.length,
      products: products.length,
      orders: orders.length,
      reviews: reviews.length,
    },
    demoAccounts: {
      admin: { email: adminUser.email, password: 'password123', role: 'admin' },
      customer: { email: customerUser.email, password: 'password123', role: 'customer' },
    },
  };
}

export async function POST() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database seed failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database seed failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}