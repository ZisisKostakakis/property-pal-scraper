'use client';

import dynamic from 'next/dynamic';
import { PropertyWithPriority } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-md" />,
});

interface MapViewProps {
  properties: PropertyWithPriority[];
  onSelect?: (p: PropertyWithPriority) => void;
}

export default function MapView({ properties, onSelect }: MapViewProps) {
  return (
    <div className="h-full w-full min-h-[400px]">
      <PropertyMap properties={properties} onSelect={onSelect} />
    </div>
  );
}
