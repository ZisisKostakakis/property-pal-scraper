'use client';

import { PropertyWithPriority } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { Home, PoundSterling, MapPin, Trophy, TrendingUp, Footprints } from 'lucide-react';

interface StatsCardsProps {
  properties: PropertyWithPriority[];
}

export default function StatsCards({ properties }: StatsCardsProps) {
  const count = properties.length;
  const avgPrice = count
    ? Math.round(properties.reduce((s, p) => s + p.price, 0) / count)
    : 0;
  const withDist = properties.filter((p) => p.distance_to_destination != null);
  const avgDistMi = withDist.length
    ? (withDist.reduce((s, p) => s + p.distance_to_destination!, 0) / withDist.length * 0.621371).toFixed(1)
    : null;
  const avgScore = count
    ? (properties.reduce((s, p) => s + p.priority_score, 0) / count).toFixed(1)
    : '0';
  const prices = properties.map((p) => p.price).sort((a, b) => a - b);
  const medianPrice = count ? prices[Math.floor(count / 2)] : 0;
  const walkingPct = count
    ? Math.round(
        (properties.filter((p) => {
          const mi = (p.distance_to_destination ?? 999) * 0.621371;
          return mi <= 0.6;
        }).length / count) * 100
      )
    : 0;

  const stats = [
    { label: 'Properties', value: String(count), icon: Home },
    { label: 'Avg Price', value: `£${avgPrice.toLocaleString('en-GB')}`, icon: PoundSterling },
    { label: 'Avg Distance', value: avgDistMi != null ? `${avgDistMi}mi` : 'N/A', icon: MapPin },
    { label: 'Avg Score', value: avgScore, icon: Trophy },
    { label: 'Median Price', value: `£${medianPrice.toLocaleString('en-GB')}`, icon: TrendingUp },
    { label: 'Walking Distance', value: `${walkingPct}%`, icon: Footprints },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-3 flex flex-col items-center text-center gap-1">
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
