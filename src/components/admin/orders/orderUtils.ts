import { Order, OrderStatus } from '@/types/voltcraft';
import { BadgeVariant } from '@/components/ui/Badge';

export const STATUS_META: Record<
  OrderStatus,
  { label: string; badge: BadgeVariant }
> = {
  pending: { label: 'รอจัดส่ง', badge: 'amber' },
  paid: { label: 'ชำระแล้ว', badge: 'emerald' },
  shipped: { label: 'กำลังจัดส่ง', badge: 'amber' },
  delivered: { label: 'ส่งสำเร็จ', badge: 'emerald' },
  cancelled: { label: 'ยกเลิก', badge: 'rose' },
};

// สอดคล้องกับกฎเปลี่ยนสถานะใน order.service.ts (COD)
export const ALLOWED_NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['shipped', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const CARRIER_PRESETS = [
  'Flash Express',
  'Kerry Express',
  'J&T Express',
  'ไปรษณีย์ไทย',
  'SPX Express',
] as const;

export function getOrderCustomerName(order: Order): string {
  if (order.shippingAddress?.recipient) return order.shippingAddress.recipient;
  if (order.customerName) return order.customerName;
  if (order.customerId && typeof order.customerId === 'object' && order.customerId.name) {
    return order.customerId.name;
  }
  return 'ลูกค้าทั่วไป';
}

export function getOrderCustomerEmail(order: Order): string | undefined {
  if (order.customerId && typeof order.customerId === 'object') {
    return order.customerId.email;
  }
  return undefined;
}

export function getOrderFullAddress(addr?: Order['shippingAddress']): string {
  if (!addr) return '-';
  return [
    addr.line1,
    addr.subdistrict,
    addr.district,
    addr.province,
    addr.postalCode,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getOrderPaymentBadge(payment?: Order['payment']): {
  text: string;
  variant: BadgeVariant;
} {
  const method = payment?.method === 'stripe' ? 'Stripe' : 'COD';
  const status = payment?.status ?? 'unpaid';

  if (status === 'paid') {
    return { text: `${method} • ชำระแล้ว`, variant: 'emerald' };
  }
  if (status === 'refunded') {
    return { text: `${method} • คืนเงินแล้ว`, variant: 'rose' };
  }
  return {
    text: method === 'COD' ? 'COD • เก็บปลายทาง' : 'Stripe • รอชำระ',
    variant: 'amber',
  };
}