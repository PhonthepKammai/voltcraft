export type UserRole = 'customer' | 'admin';

export interface Address {
  _id?: string;
  label: string
  recipient: string;
  phone: string;
  line1: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  addresses: Address[];
  createdAt: Date;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  isActive?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive?: boolean;
}

export type ProductStatus = 'active' | 'archived';

export interface Product {
  _id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  category: Category;
  brand: Brand;
  price: number; // THB
  salePrice?: number; // THB
  images: string[];
  attributes: Record<string, string>;
  status: ProductStatus;
  ratingAvg: number;
  ratingCount: number;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'stripe' | 'cod';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderCustomer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface OrderShippingAddress {
  recipient: string;
  phone: string;
  line1: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface OrderItem {
  productId: string;
  sku?: string;
  name: string;
  image?: string;
  unitPrice: number; // THB
  quantity: number;
  lineTotal: number; // THB
}

export interface Order {
  _id: string;
  orderNo: string;
  customerId?: string | OrderCustomer;
  customerName?: string; // เผื่อข้อมูลเก่า/mock
  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  subtotal: number; // THB
  shippingFee: number; // THB
  total: number; // THB
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    stripeSessionId?: string;
    paidAt?: string;
  };
  shipment?: {
    carrier?: string;
    trackingNo?: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
  note?: string;
  createdAt: string;
  updatedAt?: string;
}
export type ReviewStatus = 'published' | 'hidden';

export interface Review {
  _id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  images: string[];
  status: ReviewStatus;
  reply?: {
    text: string;
    at: string;
  };
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export type AppView = 'storefront' | 'auth' | 'admin' | 'profile' | 'orders';
export type AdminTab = 'overview' | 'users' | 'products' | 'orders' | 'taxonomy' | 'reviews';

export interface ProductFormInput {
  _id?: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  price: number;
  salePrice?: number;
  images: string[];
  attributes: Record<string, string>;
  status: ProductStatus;
  stock: number;
}