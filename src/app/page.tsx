'use client';

import React from 'react';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { useProductFilters } from '@/hooks/useProductFilters';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { FilterBar } from '@/components/storefront/FilterBar';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { ProductDetailModal } from '@/components/storefront/ProductDetailModal';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AuthView } from '@/components/auth/AuthView';
import { AdminLayout } from '@/components/admin/AdminLayout';

function VoltCraftShell() {
  const { activeView } = useAuth();
  const {
    products,
    categories,
    brands,
    reviews,
    selectedProduct,
    setSelectedProduct,
    cart,
  } = useStore();

  const filters = useProductFilters(products);

  if (activeView === 'auth') {
    return <AuthView />;
  }

  if (activeView === 'admin') {
    return <AdminLayout />;
  }

  const scrollToCatalog = () => {
    document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  console.log(brands)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <Navbar
        searchQuery={filters.searchQuery}
        onSearchChange={filters.setSearchQuery}
      />

      <main className="flex-1">
        <HeroBanner onExploreClick={scrollToCatalog} />

        <FilterBar
          categories={categories}
          brands={brands}
          categorySlug={filters.categorySlug}
          onCategoryChange={filters.setCategorySlug}
          brandSlug={filters.brandSlug}
          onBrandChange={filters.setBrandSlug}
          priceRange={filters.priceRange}
          onPriceRangeChange={filters.setPriceRange}
          inStockOnly={filters.inStockOnly}
          onInStockChange={filters.setInStockOnly}
          hasActiveFilters={filters.hasActiveFilters}
          onReset={filters.resetFilters}
          resultCount={filters.filteredProducts.length}
        />

        <ProductGrid
          products={filters.filteredProducts}
          onSelectProduct={setSelectedProduct}
          onAddToCart={(product) => cart.addToCart(product, 1)}
          onResetFilters={filters.resetFilters}
        />
      </main>

      <Footer />

      <ProductDetailModal
        product={selectedProduct}
        reviews={reviews}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, qty) => cart.addToCart(product, qty)}
      />

      <CartDrawer />
    </div>
  );
}

export default function VoltCraftPage() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <VoltCraftShell />
          <ToastContainer />
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}