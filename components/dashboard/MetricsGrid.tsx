'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

interface MetricsGridProps {
  metrics: Metric[];
  className?: string;
}

export function MetricsGrid({ metrics, className }: MetricsGridProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              </div>
              {metric.icon && (
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {metric.icon}
                </div>
              )}
            </div>
            {metric.change !== undefined && (
              <div className="mt-4 flex items-center gap-1">
                {metric.change >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-500">
                      +{metric.change}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      {metric.change}%
                    </span>
                  </>
                )}
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}


