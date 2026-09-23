'use client';

import { Vendor } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface VendorHeaderProps {
  vendor: Vendor;
}

export function VendorHeader({ vendor }: VendorHeaderProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <Badge variant="success">Verified</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{vendor.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span>📞 {vendor.whatsapp}</span>
            <span>📍 Nigeria</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="primary" className="text-sm">
            {vendor.productCount} products
          </Badge>
        </div>
      </div>
    </div>
  );
}
