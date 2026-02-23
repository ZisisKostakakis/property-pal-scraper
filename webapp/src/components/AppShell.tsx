'use client';

import { useState, useMemo, useCallback } from 'react';
import { Property, PropertyWithPriority, AlgorithmWeights } from '@/types/property';
import { calculatePriorityScores } from '@/lib/priorityAlgorithm';
import Header from './Header';
import DemoBanner from './DemoBanner';
import FilterSidebar, { FilterState, DEFAULT_FILTERS } from './FilterSidebar';
import ListView from './ListView';
import DashboardView from './DashboardView';
import MapView from './MapView';
import PropertyDetailSheet from './PropertyDetailSheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

interface AppShellProps {
  rawProperties: Property[];
  dataTimestamp: string;
}

function extractUnique(props: Property[], key: keyof Property): string[] {
  const set = new Set<string>();
  for (const p of props) {
    const v = p[key];
    if (typeof v === 'string' && v) set.add(v);
  }
  return Array.from(set).sort();
}

export default function AppShell({ rawProperties, dataTimestamp }: AppShellProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [weights, setWeights] = useState<AlgorithmWeights>({
    location: 0.6,
    price: 0.1,
    monthly: 0.2,
    rating: 0.1,
  });
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithPriority | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const heatingOptions = useMemo(() => extractUnique(rawProperties, 'heating'), [rawProperties]);
  const epcOptions = useMemo(() => extractUnique(rawProperties, 'energy_rating'), [rawProperties]);
  const typeOptions = useMemo(() => extractUnique(rawProperties, 'property_type'), [rawProperties]);
  const tenureOptions = useMemo(() => extractUnique(rawProperties, 'tenure'), [rawProperties]);

  const prioritized = useMemo(
    () => calculatePriorityScores(rawProperties, weights),
    [rawProperties, weights]
  );

  const filtered = useMemo(() => {
    return prioritized.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!p.location.toLowerCase().includes(q)) return false;
      }
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
      if ((p.bedrooms ?? 0) < filters.minBeds) return false;

      const distMi = p.distance_to_destination != null ? p.distance_to_destination * 0.621371 : null;
      if (distMi != null) {
        if (distMi < filters.distanceRange[0] || distMi > filters.distanceRange[1]) return false;
      }

      if (filters.heating !== 'all' && p.heating !== filters.heating) return false;
      if (filters.epc !== 'all' && p.energy_rating !== filters.epc) return false;
      if (filters.propertyType !== 'all' && p.property_type !== filters.propertyType) return false;
      if (filters.tenure !== 'all' && p.tenure !== filters.tenure) return false;

      return true;
    });
  }, [prioritized, filters]);

  const handleSelect = useCallback((p: PropertyWithPriority) => setSelectedProperty(p), []);

  const sidebarContent = (
    <FilterSidebar
      filters={filters}
      onFiltersChange={setFilters}
      weights={weights}
      onWeightsChange={setWeights}
      heatingOptions={heatingOptions}
      epcOptions={epcOptions}
      typeOptions={typeOptions}
      tenureOptions={tenureOptions}
    />
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header dataTimestamp={dataTimestamp} />

      <DemoBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 border-r bg-background overflow-y-auto shrink-0">
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Mobile filter button */}
          <div className="md:hidden p-2 border-b">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Filters</SheetTitle>
                {sidebarContent}
              </SheetContent>
            </Sheet>
          </div>

          <Tabs defaultValue="list" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="flex-1 overflow-auto p-4">
              <DashboardView properties={filtered} />
            </TabsContent>

            <TabsContent value="list" className="flex-1 overflow-auto p-4">
              <ListView properties={filtered} onSelect={handleSelect} />
            </TabsContent>

            <TabsContent value="map" className="flex-1 overflow-hidden p-4">
              <MapView properties={filtered} onSelect={handleSelect} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <PropertyDetailSheet
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
}
