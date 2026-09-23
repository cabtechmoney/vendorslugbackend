'use client';

import { Product } from '@/types';
import { ProductCard } from './productCard';

interface ProductGridProps {
  products: Product[];
  vendorSlug: string;
}

export function ProductGrid({ products, vendorSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{ ...product, vendorSlug }}
        />
      ))}
    </div>
  );
}