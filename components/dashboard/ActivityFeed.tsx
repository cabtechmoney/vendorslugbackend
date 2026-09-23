'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const activities = [
  { vendor: 'Yaba Thrift Hub', item: 'Vintage denim set', status: 'Packed' },
  { vendor: 'Ibadan Glam Boutique', item: 'Leather tote', status: 'In transit' },
  { vendor: 'Woven Home', item: 'Handmade rug', status: 'Awaiting pickup' },
];

export function ActivityFeed() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          24 updates
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {activities.map((item, index) => (
          <motion.div
            key={item.vendor}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div>
              <p className="font-medium">{item.vendor}</p>
              <p className="text-sm text-muted-foreground">{item.item}</p>
            </div>
            <Badge variant={item.status === 'Packed' ? 'success' : 'warning'}>
              {item.status}
            </Badge>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
