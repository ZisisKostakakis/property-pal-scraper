'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { AlgorithmWeights } from '@/types/property';

export interface FilterState {
  search: string;
  priceRange: [number, number];
  minBeds: number;
  distanceRange: [number, number];
  heating: string;
  epc: string;
  propertyType: string;
  tenure: string;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  priceRange: [0, 200000],
  minBeds: 0,
  distanceRange: [0, 10],
  heating: 'all',
  epc: 'all',
  propertyType: 'all',
  tenure: 'all',
};

const WEIGHT_META: { key: keyof AlgorithmWeights; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'price', label: 'Price' },
  { key: 'monthly', label: 'Monthly Cost' },
  { key: 'rating', label: 'AI Rating' },
];

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  weights: AlgorithmWeights;
  onWeightsChange: (weights: AlgorithmWeights) => void;
  heatingOptions: string[];
  epcOptions: string[];
  typeOptions: string[];
  tenureOptions: string[];
}

export default function FilterSidebar({
  filters,
  onFiltersChange,
  weights,
  onWeightsChange,
  heatingOptions,
  epcOptions,
  typeOptions,
  tenureOptions,
}: FilterSidebarProps) {
  const update = (partial: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  const updateWeight = (key: keyof AlgorithmWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    const total = Object.values(newWeights).reduce((s, w) => s + w, 0);
    if (total > 0) {
      onWeightsChange(
        Object.fromEntries(
          Object.entries(newWeights).map(([k, v]) => [k, v / total])
        ) as unknown as AlgorithmWeights
      );
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        <div>
          <h2 className="text-sm font-semibold mb-3">Filters</h2>

          {/* Search */}
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Address, area..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <Separator />

        {/* Price range */}
        <div className="space-y-2">
          <Label className="text-xs">
            Price: £{filters.priceRange[0].toLocaleString()} – £{filters.priceRange[1].toLocaleString()}
          </Label>
          <Slider
            min={0}
            max={200000}
            step={5000}
            value={filters.priceRange}
            onValueChange={(v) => update({ priceRange: v as [number, number] })}
          />
        </div>

        <Separator />

        {/* Min beds */}
        <div className="space-y-1.5">
          <Label className="text-xs">Min Bedrooms</Label>
          <Select
            value={String(filters.minBeds)}
            onValueChange={(v) => update({ minBeds: Number(v) })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 0 ? 'Any' : `${n}+`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Distance range */}
        <div className="space-y-2">
          <Label className="text-xs">
            Distance: {filters.distanceRange[0].toFixed(1)}mi – {filters.distanceRange[1].toFixed(1)}mi
          </Label>
          <Slider
            min={0}
            max={10}
            step={0.1}
            value={filters.distanceRange}
            onValueChange={(v) => update({ distanceRange: v as [number, number] })}
          />
        </div>

        <Separator />

        {/* Heating */}
        <div className="space-y-1.5">
          <Label className="text-xs">Heating</Label>
          <Select value={filters.heating} onValueChange={(v) => update({ heating: v })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {heatingOptions.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* EPC */}
        <div className="space-y-1.5">
          <Label className="text-xs">EPC Rating</Label>
          <Select value={filters.epc} onValueChange={(v) => update({ epc: v })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {epcOptions.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Property Type</Label>
          <Select value={filters.propertyType} onValueChange={(v) => update({ propertyType: v })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {typeOptions.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tenure */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tenure</Label>
          <Select value={filters.tenure} onValueChange={(v) => update({ tenure: v })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {tenureOptions.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Weights */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Priority Weights</h2>
          {WEIGHT_META.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">
                {label}: {(weights[key] * 100).toFixed(0)}%
              </Label>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[weights[key]]}
                onValueChange={([v]) => updateWeight(key, v)}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Auto-normalised to 100%.
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
