// src/app/(marketplace)/[vendorSlug]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/shared/Container';
import { VendorHeader } from '@/components/marketplace/VendorHeader';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { CartDrawer } from '@/components/marketplace/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import type { Vendor, Product } from '@/types';

export default function VendorStorefront() {
  const params = useParams<{ vendorSlug: string }>();
  const vendorSlug = params.vendorSlug;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setVendorError(null);
      setProductsError(null);

      // Vendor (FastAPI) and products (Go) fetched in parallel.
      // allSettled so a failing products call doesn't kill the vendor render.
      const [vendorResult, productsResult] = await Promise.allSettled([
        api.vendors.getBySlug(vendorSlug),
        api.products.getAll(vendorSlug),
      ]);

      if (signal.aborted) return;

      // --- vendor ---
      if (vendorResult.status === 'fulfilled') {
        setVendor(vendorResult.value);
      } else {
        setVendor(null);
        setVendorError(
          vendorResult.reason instanceof Error
            ? vendorResult.reason.message
            : 'Vendor not found',
        );
      }

      // --- products ---
      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value);
      } else if (vendorResult.status === 'fulfilled') {
        // Soft-fail: Go is down or errored, but FastAPI still embeds products
        // on the vendor payload. Use it as a fallback so the grid isn't empty.
        setProducts(vendorResult.value.products ?? []);
        setProductsError('Live product feed unavailable — showing cached list');
      } else {
        setProducts([]);
        setProductsError('Could not load products');
      }

      setIsLoading(false);
    },
    [vendorSlug],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (vendorError || !vendor) {
    return (
      <Container className="py-8 text-center">
        <h2 className="text-2xl font-bold">Vendor not found</h2>
        <p className="text-muted-foreground">
          {vendorError ?? "The store you're looking for doesn't exist."}
        </p>
      </Container>
    );
  }

  return (
    <>
      <Container className="space-y-8 py-8">
        <VendorHeader vendor={vendor} />
        <SearchBar onSearch={(query) => console.log(query)} />
        {productsError && (
          <p className="text-sm text-muted-foreground">{productsError}</p>
        )}
        <ProductGrid products={products} vendorSlug={vendorSlug} />
      </Container>

      {getTotalItems() > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/25"
        >
          🛒 {getTotalItems()} items
        </button>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}