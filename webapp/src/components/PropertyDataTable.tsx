'use client';

import { useState } from 'react';
import { PropertyWithPriority } from '@/types/property';
import { formatPrice, formatMonthly, formatDistance, getDistanceColor, getScoreBadgeColor } from '@/lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';

type SortKey = 'rank' | 'price' | 'monthly' | 'distance' | 'beds' | 'score';
type SortDir = 'asc' | 'desc';

interface PropertyDataTableProps {
  properties: PropertyWithPriority[];
  onSelect?: (p: PropertyWithPriority) => void;
}

export default function PropertyDataTable({ properties, onSelect }: PropertyDataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = [...properties].sort((a, b) => {
    if (sortKey === 'rank') return 0;
    let va: number, vb: number;
    switch (sortKey) {
      case 'price': va = a.price; vb = b.price; break;
      case 'monthly': va = a.calculated_monthly_payment ?? 0; vb = b.calculated_monthly_payment ?? 0; break;
      case 'distance': va = a.distance_to_destination ?? 999; vb = b.distance_to_destination ?? 999; break;
      case 'beds': va = a.bedrooms ?? 0; vb = b.bedrooms ?? 0; break;
      case 'score': va = a.priority_score; vb = b.priority_score; break;
      default: return 0;
    }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const displayList = sortKey === 'rank' ? properties : sorted;

  const SortableHead = ({ col, label }: { col: SortKey; label: string }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
        {sortKey === col && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </TableHead>
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead col="rank" label="#" />
            <TableHead className="min-w-[200px]">Address</TableHead>
            <SortableHead col="price" label="Price" />
            <SortableHead col="monthly" label="Monthly" />
            <SortableHead col="distance" label="Distance" />
            <SortableHead col="beds" label="Beds" />
            <TableHead>Heating</TableHead>
            <TableHead>EPC</TableHead>
            <SortableHead col="score" label="Score" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayList.map((p, i) => (
            <TableRow
              key={p.property_id}
              className="cursor-pointer"
              onClick={() => onSelect?.(p)}
            >
              <TableCell className="tabular-nums text-muted-foreground">
                {sortKey === 'rank' ? i + 1 : '—'}
              </TableCell>
              <TableCell className="max-w-[250px] truncate" title={p.location}>
                {p.location}
              </TableCell>
              <TableCell className="font-medium tabular-nums whitespace-nowrap">
                {formatPrice(p.price)}
              </TableCell>
              <TableCell className="tabular-nums whitespace-nowrap text-muted-foreground">
                {formatMonthly(p.calculated_monthly_payment)}
              </TableCell>
              <TableCell className={`font-medium tabular-nums whitespace-nowrap ${getDistanceColor(p.distance_to_destination)}`}>
                {formatDistance(p.distance_to_destination)}
              </TableCell>
              <TableCell className="text-muted-foreground">{p.bedrooms ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{p.heating ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{p.energy_rating ?? '—'}</TableCell>
              <TableCell>
                <Badge className={`text-xs font-bold ${getScoreBadgeColor(p.priority_score)}`}>
                  {p.priority_score}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {displayList.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No properties match filters
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
