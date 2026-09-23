'use client';

import { Card } from '@/components/ui/Card';

export function ChartWidget() {
  // Placeholder for chart - you can integrate Chart.js or Recharts
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Revenue Overview</h3>
        <span className="text-sm text-muted-foreground">Last 7 days</span>
      </div>
      <div className="mt-4 h-48 flex items-end gap-2">
        {[72, 88, 64, 92, 81, 96, 78].map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-gradient-to-t from-primary/50 to-primary"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </Card>
  );
}
