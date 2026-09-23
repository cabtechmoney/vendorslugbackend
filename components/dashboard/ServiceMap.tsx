'use client';

import { Card } from '@/components/ui/Card';
import { Search, ShoppingBag, Truck } from 'lucide-react';

const services = [
  {
    title: 'Discovery Engine',
    description: 'Search, categories, and AI recommendations.',
    icon: Search,
  },
  {
    title: 'Cart & Checkout',
    description: 'Fast basket assembly and secure checkout.',
    icon: ShoppingBag,
  },
  {
    title: 'Logistics Engine',
    description: 'Routing, delivery, and pickup coordination.',
    icon: Truck,
  },
];

export function ServiceMap() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold">Core Services</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.title}
              className="rounded-xl border p-4 hover:shadow-md transition-shadow"
            >
              <div className="rounded-full bg-primary/10 p-2 w-fit">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="mt-2 font-medium">{service.title}</h4>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
