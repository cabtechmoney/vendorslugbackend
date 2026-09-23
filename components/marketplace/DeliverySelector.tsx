'use client';

import { DeliveryZone } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface DeliverySelectorProps {
  zones: DeliveryZone[];
}

export function DeliverySelector({ zones }: DeliverySelectorProps) {
  const { state, setDeliveryZone } = useCart();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Delivery Zone</label>
      <select
        value={state.deliveryZone?.id || ''}
        onChange={(e) => {
          const zone = zones.find((z) => z.id === e.target.value);
          if (zone) setDeliveryZone(zone);
        }}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Select your location</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name} - ₦{zone.fee.toLocaleString()} ({zone.estimatedDays})
          </option>
        ))}
      </select>
    </div>
  );
}