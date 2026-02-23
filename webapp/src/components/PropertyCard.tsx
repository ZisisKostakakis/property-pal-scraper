'use client';

import { PropertyWithPriority } from '@/types/property';
import { formatPrice, formatMonthly, formatDistance, getDistanceColor } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Ruler, Flame, Zap, MapPin, Star } from 'lucide-react';

interface PropertyCardProps {
  property: PropertyWithPriority;
  rank: number;
  onClick?: () => void;
}

function scoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 60) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}

export default function PropertyCard({ property, rank, onClick }: PropertyCardProps) {
  const score = isNaN(property.priority_score) ? null : property.priority_score;
  const distColor = getDistanceColor(property.distance_to_destination);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <span className="text-xs text-muted-foreground font-medium">#{rank}</span>
          <div className="flex items-center gap-1.5">
            {property.tenure && (
              <Badge variant="outline" className="text-xs">{property.tenure}</Badge>
            )}
            {score != null && (
              <Badge variant={scoreBadgeVariant(score)} className="text-xs font-bold">
                {score}
              </Badge>
            )}
          </div>
        </div>

        {/* Price + location */}
        <div>
          <p className="text-xl font-bold">{formatPrice(property.price)}</p>
          <p className="text-sm text-muted-foreground leading-snug mt-0.5">{property.location}</p>
        </div>

        {/* Attributes */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.bedrooms}</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>
          )}
          {property.size != null && (
            <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{property.size}m²</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {property.heating && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Flame className="h-3.5 w-3.5" />{property.heating}
            </span>
          )}
          {property.energy_rating && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />EPC: {property.energy_rating}
            </span>
          )}
          <span className={`flex items-center gap-1 font-medium ${distColor}`}>
            <MapPin className="h-3.5 w-3.5" />{formatDistance(property.distance_to_destination)}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm border-t pt-2.5 mt-auto">
          <span className="text-muted-foreground">
            {formatMonthly(property.calculated_monthly_payment)} est.
          </span>
          {property.perplexity_rating != null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5" />{property.perplexity_rating}/10
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
