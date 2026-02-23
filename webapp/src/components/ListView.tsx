'use client';

import { PropertyWithPriority } from '@/types/property';
import PropertyCardGrid from './PropertyCardGrid';
import PropertyDataTable from './PropertyDataTable';

interface ListViewProps {
  properties: PropertyWithPriority[];
  onSelect?: (p: PropertyWithPriority) => void;
}

export default function ListView({ properties, onSelect }: ListViewProps) {
  return (
    <div className="space-y-6">
      <PropertyCardGrid properties={properties} count={6} onSelect={onSelect} />

      <section>
        <h2 className="text-lg font-semibold mb-3">
          All Properties ({properties.length})
        </h2>
        <PropertyDataTable properties={properties} onSelect={onSelect} />
      </section>
    </div>
  );
}
