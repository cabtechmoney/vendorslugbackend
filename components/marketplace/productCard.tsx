
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product & { vendorSlug: string };
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'group relative rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl',
        className
      )}
    >
      <Link href={`/${product.vendorSlug}/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.img}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.tag && (
            <div className="absolute top-3 left-3">
              <Badge variant="warning" className="shadow-lg">
                {product.tag}
              </Badge>
            </div>
          )}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300',
              isHovered && 'opacity-100'
            )}
          />
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-2xl font-bold text-primary">
            ₦{product.price.toLocaleString()}
          </p>
          <Badge variant={product.inStock ? 'success' : 'danger'}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>
      </Link>

      <div
        className={cn(
          'absolute top-3 right-3 space-y-2 transition-all duration-300',
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        )}
      >
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="rounded-full bg-background/90 backdrop-blur-sm p-2 shadow-lg hover:bg-background transition-colors"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors',
              isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
            )}
          />
        </button>
        <Link
          href={`/${product.vendorSlug}/product/${product.id}`}
          className="block rounded-full bg-background/90 backdrop-blur-sm p-2 shadow-lg hover:bg-background transition-colors"
        >
          <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </Link>
      </div>

      <div className="absolute bottom-3 left-3 right-3">
        <Button
          onClick={() => addToCart(product)}
          variant="gradient"
          size="sm"
          className="w-full gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </motion.div>
  );
}