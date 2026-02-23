'use client';

import { PropertyWithPriority } from '@/types/property';
import { formatPrice, formatMonthly, formatDistance, getDistanceColor, getScoreBadgeColor } from '@/lib/formatters';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bed, Bath, Ruler, Flame, Zap, MapPin, Star, ExternalLink } from 'lucide-react';

interface PropertyDetailSheetProps {
  property: PropertyWithPriority | null;
  onClose: () => void;
}

export default function PropertyDetailSheet({ property, onClose }: PropertyDetailSheetProps) {
  if (!property) return null;

  const p = property;
  const distColor = getDistanceColor(p.distance_to_destination);

  return (
    <Sheet open={!!property} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-lg leading-snug pr-6">
            {p.location}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Price + score */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{formatPrice(p.price)}</span>
            <Badge className={`text-sm font-bold ${getScoreBadgeColor(p.priority_score)}`}>
              Score: {p.priority_score}
            </Badge>
          </div>

          {/* Key attributes */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {p.bedrooms != null && (
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span>{p.bedrooms} Bedrooms</span>
              </div>
            )}
            {p.bathrooms != null && (
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span>{p.bathrooms} Bathrooms</span>
              </div>
            )}
            {p.size != null && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>{p.size}m²</span>
              </div>
            )}
            {p.heating && (
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span>{p.heating}</span>
              </div>
            )}
            {p.energy_rating && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>EPC: {p.energy_rating}</span>
              </div>
            )}
            <div className={`flex items-center gap-2 font-medium ${distColor}`}>
              <MapPin className="h-4 w-4" />
              <span>{formatDistance(p.distance_to_destination)}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {p.tenure && <Badge variant="outline">{p.tenure}</Badge>}
            {p.property_type && <Badge variant="outline">{p.property_type}</Badge>}
          </div>

          <Separator />

          {/* Cost breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Monthly Cost Estimate</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mortgage (est.)</span>
                <span className="font-medium">{formatMonthly(p.calculated_monthly_payment)}</span>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          {p.location_score != null && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Score Breakdown</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location Score</span>
                    <span className="font-medium">{p.location_score}/100</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* AI Rating */}
          {p.perplexity_rating != null && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">AI Rating: {p.perplexity_rating}/10</span>
              </div>
            </>
          )}

          {/* Perplexity analysis */}
          {p.perplexity_analysis && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {p.perplexity_analysis}
                </p>
              </div>
            </>
          )}

          {/* Description */}
          {p.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {p.description}
                </p>
              </div>
            </>
          )}

          {/* Features */}
          {p.features && p.features.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {p.features.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Separator />

          <Button asChild className="w-full">
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on PropertyPal
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
