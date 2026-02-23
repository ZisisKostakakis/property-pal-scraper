'use client';

import { PropertyWithPriority } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface DistanceDistChartProps {
  properties: PropertyWithPriority[];
}

const TIERS = [
  { label: '0–0.6mi', min: 0, max: 0.6, color: '#22c55e' },
  { label: '0.6–1.5mi', min: 0.6, max: 1.5, color: '#f59e0b' },
  { label: '1.5–3mi', min: 1.5, max: 3, color: '#ef4444' },
  { label: '3+mi', min: 3, max: Infinity, color: '#6b7280' },
];

export default function DistanceDistChart({ properties }: DistanceDistChartProps) {
  const data = TIERS.map((t) => ({
    name: t.label,
    count: properties.filter((p) => {
      if (p.distance_to_destination == null) return false;
      const mi = p.distance_to_destination * 0.621371;
      return mi >= t.min && mi < t.max;
    }).length,
    color: t.color,
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Distance Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
