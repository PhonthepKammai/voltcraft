import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import {
  Brand,
  Cart,
  Category,
  Order,
  ORDER_STATUS,
  Product,
  Review,
  User,
} from '@/models';

export async function seedDatabase() {
  await connectDB();

  // Clear existing collections in parallel
  await Promise.all([
    Review.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    User.deleteMany({}),
  ]);

  // 1. Seed Users (1 Admin, 1 Customer)
  const [adminPassword, customerPassword] = await Promise.all([
    bcrypt.hash('Admin@1234', 10),
    bcrypt.hash('Customer@1234', 10),
  ]);

  const [adminUser, customerUser] = await User.create([
    {
      name: 'VoltCraft Admin',
      email: 'admin@voltcraft.com',
      password: adminPassword,
      phone: '02-000-1111',
      role: 'admin',
    },
    {
      name: 'Somchai Jaidee',
      email: 'customer@voltcraft.com',
      password: customerPassword,
      phone: '081-234-5678',
      role: 'customer',
    },
  ]);

  // 2. Seed 5 Categories
  const categories = await Category.create([
    {
      name: 'Air Conditioners',
      slug: 'air-conditioners',
      description: 'Inverter wall-mounted air conditioners suited for Thai climate',
    },
    {
      name: 'Refrigerators',
      slug: 'refrigerators',
      description: 'Multi-door and inverter refrigerators with energy-saving compressors',
    },
    {
      name: 'Washing Machines',
      slug: 'washing-machines',
      description: 'Front-load and top-load inverter washing machines',
    },
    {
      name: 'Televisions',
      slug: 'televisions',
      description: '4K QLED, OLED, and Smart TVs',
    },
    {
      name: 'Small Appliances',
      slug: 'small-appliances',
      description: 'Air purifiers, microwaves, and everyday home electrical appliances',
    },
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  // 3. Seed 5 Brands
  const brands = await Brand.create([
    { name: 'Mitsubishi Electric', slug: 'mitsubishi-electric' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'LG', slug: 'lg' },
    { name: 'Panasonic', slug: 'panasonic' },
    { name: 'Sharp', slug: 'sharp' },
  ]);

  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b._id]));

  // 4. Seed 10 Electrical Appliances (Prices in THB)
  const products = await Product.create([
    {
      name: 'Mitsubishi Electric Mr. Slim Happy Inverter 12,000 BTU',
      slug: 'mitsubishi-mr-slim-happy-inverter-12000-btu',
      sku: 'MIT-MSY-KY13VF',
      description: 'Fast cooling inverter AC with PM2.5 filter and dual barrier coating.',
      categoryId: catMap['air-conditioners'],
      brandId: brandMap['mitsubishi-electric'],
      price: 21900,
      salePrice: 18900,
      stock: 15,
      images: ['https://placehold.co/800x600?text=Mitsubishi+AC+12000BTU'],
      specs: { btu: '12,000 BTU', energyLabel: 'No. 5 (1 Star)', warranty: '5 Years Compressor' },
      status: 'active',
      ratingAvg: 5,
      ratingCount: 1,
    },
    {
      name: 'Mitsubishi Electric 2-Door Inverter Refrigerator 12.2 Q',
      slug: 'mitsubishi-2-door-inverter-fridge-12-2q',
      sku: 'MIT-MR-FC38ES',
      description: 'Neuro Inverter technology with vitamin factory vegetable drawer.',
      categoryId: catMap['refrigerators'],
      brandId: brandMap['mitsubishi-electric'],
      price: 15900,
      salePrice: 13990,
      stock: 10,
      images: ['https://placehold.co/800x600?text=Mitsubishi+Fridge'],
      specs: { capacity: '344 L (12.2 Q)', energyLabel: 'No. 5 (2 Stars)', warranty: '10 Years Compressor' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'Samsung WindFree Premium Plus Inverter 18,000 BTU',
      slug: 'samsung-windfree-premium-18000-btu',
      sku: 'SAM-AR18CYEC',
      description: 'Gentle cooling through 23,000 micro air holes with SmartThings Wi-Fi control.',
      categoryId: catMap['air-conditioners'],
      brandId: brandMap['samsung'],
      price: 29900,
      salePrice: 25900,
      stock: 8,
      images: ['https://placehold.co/800x600?text=Samsung+WindFree+AC'],
      specs: { btu: '18,000 BTU', wifi: 'SmartThings', warranty: '10 Years Compressor' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'Samsung 55" QLED 4K Smart TV Q60D',
      slug: 'samsung-55-qled-4k-smart-tv-q60d',
      sku: 'SAM-QA55Q60D',
      description: '100% Color Volume with Quantum Dot and AirSlim design.',
      categoryId: catMap['televisions'],
      brandId: brandMap['samsung'],
      price: 21990,
      salePrice: 17490,
      stock: 12,
      images: ['https://placehold.co/800x600?text=Samsung+55+QLED'],
      specs: { screenSize: '55 inches', resolution: '4K UHD', os: 'Tizen OS' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'LG Front-Load AI DD Inverter Washing Machine 10.5 kg',
      slug: 'lg-front-load-ai-dd-washer-10-5kg',
      sku: 'LG-FV1450S3V',
      description: 'AI Direct Drive fabric protection with Steam+ allergy care cycle.',
      categoryId: catMap['washing-machines'],
      brandId: brandMap['lg'],
      price: 19900,
      salePrice: 15900,
      stock: 14,
      images: ['https://placehold.co/800x600?text=LG+Washer+10.5kg'],
      specs: { capacity: '10.5 kg', spinSpeed: '1,400 RPM', warranty: '10 Years Motor' },
      status: 'active',
      ratingAvg: 4,
      ratingCount: 1,
    },
    {
      name: 'LG 55" OLED evo C4 4K Smart TV',
      slug: 'lg-55-oled-evo-c4-4k-tv',
      sku: 'LG-OLED55C4PSA',
      description: 'Self-lit OLED pixels powered by Alpha 9 AI Processor Gen7.',
      categoryId: catMap['televisions'],
      brandId: brandMap['lg'],
      price: 49990,
      salePrice: 42900,
      stock: 6,
      images: ['https://placehold.co/800x600?text=LG+OLED+C4+55'],
      specs: { screenSize: '55 inches', refreshRate: '144Hz', hdr: 'Dolby Vision' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'Panasonic Prime+ Edition 2-Door Refrigerator 14.5 Q',
      slug: 'panasonic-prime-plus-fridge-14-5q',
      sku: 'PAN-NR-BV361BPST',
      description: 'Prime Fresh -3C soft freezing and nanoe X air deodorization.',
      categoryId: catMap['refrigerators'],
      brandId: brandMap['panasonic'],
      price: 19900,
      salePrice: null,
      stock: 9,
      images: ['https://placehold.co/800x600?text=Panasonic+Fridge'],
      specs: { capacity: '410 L (14.5 Q)', freezer: 'Bottom Freezer', warranty: '12 Years Compressor' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'Panasonic Solo Microwave Oven 25L',
      slug: 'panasonic-solo-microwave-25l',
      sku: 'PAN-NN-ST34N',
      description: '800W compact microwave with 9 auto cooking menus and Quick 30 function.',
      categoryId: catMap['small-appliances'],
      brandId: brandMap['panasonic'],
      price: 3490,
      salePrice: 2890,
      stock: 25,
      images: ['https://placehold.co/800x600?text=Panasonic+Microwave'],
      specs: { capacity: '25 Liters', power: '800W', control: 'Touch Panel' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'Sharp Plasmacluster Air Purifier FP-J40TA',
      slug: 'sharp-plasmacluster-air-purifier-fp-j40ta',
      sku: 'SHP-FP-J40TA',
      description: 'Covers up to 30 sq.m. with HEPA filter and High-Density 7000 Plasmacluster ions.',
      categoryId: catMap['small-appliances'],
      brandId: brandMap['sharp'],
      price: 6990,
      salePrice: 5490,
      stock: 20,
      images: ['https://placehold.co/800x600?text=Sharp+Air+Purifier'],
      specs: { roomSize: '30 sq.m.', filter: 'HEPA + Deodorizing', noise: '15 dB Sleep Mode' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      name: 'Sharp Top-Load Inverter Washing Machine 12 kg',
      slug: 'sharp-top-load-inverter-washer-12kg',
      sku: 'SHP-ES-W120ST',
      description: 'Holeless stainless steel tub saves water and prevents mold buildup.',
      categoryId: catMap['washing-machines'],
      brandId: brandMap['sharp'],
      price: 11900,
      salePrice: 9990,
      stock: 11,
      images: ['https://placehold.co/800x600?text=Sharp+Washer+12kg'],
      specs: { capacity: '12 kg', motor: 'J-Tech Inverter', warranty: '10 Years Motor' },
      status: 'active',
      ratingAvg: 0,
      ratingCount: 0,
    },
  ]);

  const deliveredStatus = ORDER_STATUS.DELIVERED ?? 'delivered';
  const paidStatus = ORDER_STATUS.PAID ?? 'paid';

  // 5. Seed 2 Sample Orders
  const [deliveredOrder, paidOrder] = await Order.create([
    {
      orderNo: 'VC-2611-A1B2C3',
      userId: customerUser._id,
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          sku: products[0].sku,
          image: products[0].images[0],
          price: 18900,
          quantity: 1,
          subtotal: 18900,
        },
        {
          productId: products[4]._id,
          name: products[4].name,
          sku: products[4].sku,
          image: products[4].images[0],
          price: 15900,
          quantity: 1,
          subtotal: 15900,
        },
      ],
      subtotal: 34800,
      shippingFee: 0,
      total: 34800,
      shippingAddress: {
        fullName: 'Somchai Jaidee',
        phone: '081-234-5678',
        line1: '99/12 Chaeng Watthana Rd',
        subdistrict: 'Bang Talat',
        district: 'Pak Kret',
        province: 'Nonthaburi',
        postalCode: '11120',
      },
      note: 'Please call 30 minutes before delivery',
      status: deliveredStatus,
      payment: {
        method: 'stripe',
        status: 'paid',
        stripeSessionId: 'cs_test_seed_delivered_001',
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      },
      shipment: {
        carrier: 'VoltCraft Express',
        trackingNo: 'VCE-TH-88001122',
        shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      },
    },
    {
      orderNo: 'VC-2611-D4E5F6',
      userId: customerUser._id,
      items: [
        {
          productId: products[8]._id,
          name: products[8].name,
          sku: products[8].sku,
          image: products[8].images[0],
          price: 5490,
          quantity: 2,
          subtotal: 10980,
        },
      ],
      subtotal: 10980,
      shippingFee: 0,
      total: 10980,
      shippingAddress: {
        fullName: 'Somchai Jaidee',
        phone: '081-234-5678',
        line1: '99/12 Chaeng Watthana Rd',
        subdistrict: 'Bang Talat',
        district: 'Pak Kret',
        province: 'Nonthaburi',
        postalCode: '11120',
      },
      status: paidStatus,
      payment: {
        method: 'stripe',
        status: 'paid',
        stripeSessionId: 'cs_test_seed_paid_002',
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    },
  ]);

  // 6. Seed 2 Sample Reviews (linked to the delivered order)
  const reviews = await Review.create([
    {
      userId: customerUser._id,
      productId: products[0]._id,
      orderId: deliveredOrder._id,
      rating: 5,
      comment: 'Cools down our bedroom very fast and runs almost silently at night.',
      status: 'published',
      reply: {
        text: 'Thank you for choosing VoltCraft! Enjoy your new Mitsubishi Electric AC.',
        at: new Date(),
      },
    },
    {
      userId: customerUser._id,
      productId: products[4]._id,
      orderId: deliveredOrder._id,
      rating: 4,
      comment: 'Great washing performance and gentle on clothes. Delivery team was helpful.',
      status: 'published',
    },
  ]);

  return {
    users: { admin: adminUser.email, customer: customerUser.email },
    counts: {
      categories: categories.length,
      brands: brands.length,
      products: products.length,
      orders: [deliveredOrder, paidOrder].length,
      reviews: reviews.length,
    },
  };
}