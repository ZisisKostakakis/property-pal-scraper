'use client';

import { PropertyWithPriority } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PriceDistChartProps {
  properties: PropertyWithPriority[];
}

export default function PriceDistChart({ properties }: PriceDistChartProps) {
  const buckets = [
    { label: '0-50k', min: 0, max: 50000 },
    { label: '50-70k', min: 50000, max: 70000 },
    { label: '70-85k', min: 70000, max: 85000 },
    { label: '85-100k', min: 85000, max: 100000 },
    { label: '100-110k', min: 100000, max: 110000 },
    { label: '110-120k', min: 110000, max: 120000 },
    { label: '120-130k', min: 120000, max: 130000 },
    { label: '130-140k', min: 130000, max: 140000 },
    { label: '140-160k', min: 140000, max: 160000 },
    { label: '160k+', min: 160000, max: Infinity },
  ];

  const data = buckets.map((b) => ({
    name: b.label,
    count: properties.filter((p) => p.price >= b.min && p.price < b.max).length,
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Price Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
