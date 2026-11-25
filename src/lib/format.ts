const thbFormatter = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 0,
});

export function formatTHB(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `฿${thbFormatter.format(safeAmount)}`;
}

export function formatDateTH(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getEffectivePrice(price: number, salePrice?: number): number {
  if (typeof salePrice === 'number' && salePrice > 0 && salePrice < price) {
    return salePrice;
  }
  return price;
}

export function getDiscountPercent(price: number, salePrice?: number): number | null {
  if (typeof salePrice === 'number' && salePrice > 0 && salePrice < price) {
    return Math.round(((price - salePrice) / price) * 100);
  }
  return null;
}