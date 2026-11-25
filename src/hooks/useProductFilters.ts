'use client';

import { useMemo, useState } from 'react';
import { Product } from '@/types/voltcraft';
import { getEffectivePrice } from '@/lib/format';

export type PriceRangeKey = 'all' | 'under-10k' | '10k-25k' | 'over-25k';

export function useProductFilters(products: Product[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>('all');
  const [brandSlug, setBrandSlug] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<PriceRangeKey>('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (product.status !== 'active') return false;

      if (categorySlug !== 'all' && product.category.slug !== categorySlug) {
        return false;
      }

      if (brandSlug !== 'all' && product.brand.slug !== brandSlug) {
        return false;
      }

      if (inStockOnly && product.stock <= 0) {
        return false;
      }

      const effectivePrice = getEffectivePrice(product.price, product.salePrice);
      if (priceRange === 'under-10k' && effectivePrice >= 10000) return false;
      if (priceRange === '10k-25k' && (effectivePrice < 10000 || effectivePrice > 25000)) {
        return false;
      }
      if (priceRange === 'over-25k' && effectivePrice <= 25000) return false;

      if (query) {
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesBrand = product.brand.name.toLowerCase().includes(query);
        const matchesCategory = product.category.name.toLowerCase().includes(query);
        return matchesName || matchesSku || matchesBrand || matchesCategory;
      }

      return true;
    });
  }, [products, searchQuery, categorySlug, brandSlug, priceRange, inStockOnly]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categorySlug !== 'all' ||
    brandSlug !== 'all' ||
    priceRange !== 'all' ||
    inStockOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setCategorySlug('all');
    setBrandSlug('all');
    setPriceRange('all');
    setInStockOnly(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    categorySlug,
    setCategorySlug,
    brandSlug,
    setBrandSlug,
    priceRange,
    setPriceRange,
    inStockOnly,
    setInStockOnly,
    filteredProducts,
    hasActiveFilters,
    resetFilters,
  };
}