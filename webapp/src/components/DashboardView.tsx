'use client';

import { PropertyWithPriority } from '@/types/property';
import StatsCards from './StatsCards';
import PriceDistChart from './PriceDistChart';
import DistanceDistChart from './DistanceDistChart';
import ScoreDistChart from './ScoreDistChart';

interface DashboardViewProps {
  properties: PropertyWithPriority[];
}

export default function DashboardView({ properties }: DashboardViewProps) {
  return (
    <div className="space-y-4">
      <StatsCards properties={properties} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <PriceDistChart properties={properties} />
        <DistanceDistChart properties={properties} />
        <ScoreDistChart properties={properties} />
      </div>
    </div>
  );
}
