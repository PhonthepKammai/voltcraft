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
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
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
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  image: string;
  unitPrice: number; // THB
  quantity: number;
  lineTotal: number; // THB
}

export interface Order {
  _id: string;
  orderNo: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number; // THB
  shippingFee: number; // THB
  total: number; // THB
  status: OrderStatus;
  payment: {
    method: 'stripe';
    status: PaymentStatus;
    paidAt?: string;
  };
  shipment: {
    carrier?: string;
    trackingNo?: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
  createdAt: string;
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

export type AppView = 'storefront' | 'auth' | 'admin' | 'profile';
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