'use client';

import { Container } from '@/components/shared/Container';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ServiceMap } from '@/components/dashboard/ServiceMap';
import { Badge } from '@/components/ui/Badge';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Gross Merchandise Value', value: '$184K', change: 14, icon: '💰' },
    { label: 'Active Vendors', value: '128', change: 9, icon: '👥' },
    { label: 'Fulfillment Speed', value: '2.4h', change: -5, icon: '⏱️' },
    { label: 'Conversion Rate', value: '3.2%', change: 12, icon: '📈' },
  ];

  return (
    <Container className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your marketplace performance across all vendors.</p>
        </div>
        <Badge variant="success" className="text-sm">
          Live
        </Badge>
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