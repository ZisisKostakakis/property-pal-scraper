'use client';

import { PropertyWithPriority } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface ScoreDistChartProps {
  properties: PropertyWithPriority[];
}

const ZONES = [
  { label: '0–20', min: 0, max: 20, color: '#ef4444' },
  { label: '20–40', min: 20, max: 40, color: '#ef4444' },
  { label: '40–50', min: 40, max: 50, color: '#f59e0b' },
  { label: '50–60', min: 50, max: 60, color: '#f59e0b' },
  { label: '60–70', min: 60, max: 70, color: '#22c55e' },
  { label: '70–80', min: 70, max: 80, color: '#22c55e' },
  { label: '80+', min: 80, max: Infinity, color: '#16a34a' },
];

export default function ScoreDistChart({ properties }: ScoreDistChartProps) {
  const data = ZONES.map((z) => ({
    name: z.label,
    count: properties.filter((p) => p.priority_score >= z.min && p.priority_score < z.max).length,
    color: z.color,
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Score Distribution</h3>
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
