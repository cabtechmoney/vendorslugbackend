'use client';

import {useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/shared/Container';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { ServiceMap } from '@/components/dashboard/ServiceMap';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const metrics = [
    { label: 'Gross Merchandise Value', value: '$184K', change: 14, icon: '💰' },
    { label: 'Active Vendors', value: '128', change: 9, icon: '👥' },
    { label: 'Fulfillment Speed', value: '2.4h', change: -5, icon: '⏱️' },
    { label: 'Conversion Rate', value: '3.2%', change: 12, icon: '📈' },
  ];

  return (
    <Container className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.shopName || 'Vendor'}</h1>
        <p className="text-muted-foreground">Here is what is happening with your marketplace</p>
      </div>

      <MetricsGrid metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartWidget />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      <ServiceMap />
    </Container>
  );
}