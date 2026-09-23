import Link from 'next/link';
import { ArrowRight, Store } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/Button';

export default function PlaceholderProductRoute() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="h-7 w-7" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Vendor marketplace
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Choose a store to view this product
        </h1>
        <p className="mt-3 text-muted-foreground">
          Product pages use a vendor slug, such as{' '}
          <span className="font-medium text-foreground">/acme/product/42</span>.
          Open a storefront first so the product can be loaded from the correct vendor.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90"
        >
          Browse storefronts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Container>
  );
}