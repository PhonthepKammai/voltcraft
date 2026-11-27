import type { Address } from '@/types/voltcraft';

export const EMPTY_ADDRESS: Address = {
  label: 'บ้าน',
  recipient: '',
  phone: '',
  line1: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
  isDefault: false,
};

export function normalizeAddresses(
  list: Address[],
  preferredDefaultIndex?: number
): Address[] {
  if (list.length === 0) return [];
  let defaultIdx =
    preferredDefaultIndex !== undefined
      ? preferredDefaultIndex
      : list.findIndex((a) => a.isDefault);
  if (defaultIdx < 0) defaultIdx = 0;
  return list.map((addr, idx) => ({ ...addr, isDefault: idx === defaultIdx }));
}

/** ตัดช่องว่างหัวท้ายของทุก field ข้อความ */
export function sanitizeAddress(addr: Address): Address {
  return {
    ...addr,
    label: (addr.label ?? '').trim(),
    recipient: addr.recipient.trim(),
    phone: addr.phone.trim(),
    line1: addr.line1.trim(),
    subdistrict: (addr.subdistrict ?? '').trim(),
    district: (addr.district ?? '').trim(),
    province: addr.province.trim(),
    postalCode: addr.postalCode.trim(),
  };
}

/** คืนข้อความ error ภาษาไทย หรือ null ถ้าผ่าน (ควรเรียกหลัง sanitizeAddress) */
export function validateAddress(addr: Address): string | null {
  if (!addr.recipient) return 'กรุณากรอกชื่อผู้รับ';
  if (!addr.line1) return 'กรุณากรอกบ้านเลขที่ / ถนน';
  if (!addr.province) return 'กรุณากรอกจังหวัด';

  const phoneDigits = addr.phone.replace(/\D/g, '');
  if (!/^0\d{8,9}$/.test(phoneDigits)) {
    return 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081-234-5678)';
  }
  if (!/^\d{5}$/.test(addr.postalCode)) {
    return 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก';
  }
  return null;
}