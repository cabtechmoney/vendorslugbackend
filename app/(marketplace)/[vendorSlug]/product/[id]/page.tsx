'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { ArrowLeft, Truck, Shield, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id: productId, vendorSlug } = useParams<{ id: string; vendorSlug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    api.products.getById(productId, vendorSlug)
      .then((productData) => {
        if (isCurrent) setProduct(productData);
      })
      .catch(() => {
        if (isCurrent) {
          setProduct(null);
          toast.error('Product not found');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [productId, vendorSlug]);
  if (isLoading) return <Container className="py-8"><div className="animate-pulse space-y-6"><div className="h-8 w-32 rounded bg-muted" /><div className="grid gap-6 md:grid-cols-2"><div className="h-96 rounded-2xl bg-muted" /><div className="space-y-4"><div className="h-8 w-3/4 rounded bg-muted" /><div className="h-6 w-1/2 rounded bg-muted" /><div className="h-24 rounded bg-muted" /></div></div></div></Container>;
  if (!product) return <Container className="py-8 text-center"><h2 className="text-2xl font-bold">Product not found</h2><Button onClick={() => router.push(`/${vendorSlug}`)} className="mt-4">Back to Shop</Button></Container>;

  return <Container className="py-8"><button onClick={() => router.push(`/${vendorSlug}`)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to shop</button><div className="grid gap-8 md:grid-cols-2"><Card className="overflow-hidden"><div className="relative aspect-square"><Image src={product.img} alt={product.name} fill className="object-cover" priority /></div></Card><div className="space-y-6"><div>{product.tag && <Badge variant="warning" className="mb-2">{product.tag}</Badge>}<h1 className="text-3xl font-bold">{product.name}</h1><p className="mt-2 text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</p></div><div className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span className="font-medium">4.8</span><span className="text-muted-foreground">(124 reviews)</span></div><p className="leading-relaxed text-muted-foreground">{product.description}</p><div className="grid grid-cols-2 gap-4"><div className="rounded-xl border p-4"><Truck className="h-5 w-5 text-cyan-500" /><p className="mt-2 font-medium">Fast Delivery</p><p className="text-sm text-muted-foreground">2-3 business days</p></div><div className="rounded-xl border p-4"><Shield className="h-5 w-5 text-emerald-500" /><p className="mt-2 font-medium">Secure Purchase</p><p className="text-sm text-muted-foreground">100% authentic</p></div></div><Button variant="gradient" size="lg" className="flex-1" onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); }} disabled={!product.inStock}>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</Button><p className="text-sm text-muted-foreground">{product.inStock ? 'In stock' : 'Out of stock'}</p></div></div></Container>;
}
