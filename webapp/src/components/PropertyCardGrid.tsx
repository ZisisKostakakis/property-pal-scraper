'use client';

import { PropertyWithPriority } from '@/types/property';
import PropertyCard from './PropertyCard';

interface PropertyCardGridProps {
  properties: PropertyWithPriority[];
  count?: number;
  onSelect?: (p: PropertyWithPriority) => void;
}

export default function PropertyCardGrid({ properties, count = 6, onSelect }: PropertyCardGridProps) {
  const top = properties.slice(0, count);
  if (top.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">
        Top {Math.min(count, top.length)} Properties
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {top.map((p, i) => (
          <PropertyCard
            key={p.property_id}
            property={p}
            rank={i + 1}
            onClick={() => onSelect?.(p)}
          />
        ))}
      </div>
    </section>
  );
}
