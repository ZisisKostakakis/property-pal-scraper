'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { PropertyWithPriority } from '@/types/property';
import { formatPrice, formatDistance } from '@/lib/formatters';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function scoreColor(score: number): string {
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

interface PropertyMapProps {
  properties: PropertyWithPriority[];
  onSelect?: (p: PropertyWithPriority) => void;
}

// Belfast center
const CENTER: [number, number] = [54.59, -5.93];

export default function PropertyMap({ properties, onSelect }: PropertyMapProps) {
  const withCoords = properties.filter((p) => p.lat != null && p.lng != null);

  return (
    <MapContainer
      center={CENTER}
      zoom={13}
      className="h-full w-full rounded-md"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Destination marker */}
      <Marker position={CENTER} icon={defaultIcon}>
        <Popup>Destination</Popup>
      </Marker>

      {/* Property markers */}
      {withCoords.map((p) => (
        <CircleMarker
          key={p.property_id}
          center={[p.lat!, p.lng!]}
          radius={8}
          fillColor={scoreColor(p.priority_score)}
          color={scoreColor(p.priority_score)}
          weight={2}
          opacity={0.8}
          fillOpacity={0.6}
          eventHandlers={{
            click: () => onSelect?.(p),
          }}
        >
          <Popup>
            <div className="text-sm space-y-1 min-w-[150px]">
              <p className="font-semibold">{formatPrice(p.price)}</p>
              <p className="text-xs">{p.location}</p>
              <p className="text-xs">
                {formatDistance(p.distance_to_destination)} · Score: {p.priority_score}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
