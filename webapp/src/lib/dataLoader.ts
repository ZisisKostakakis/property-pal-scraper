import fs from 'fs';
import path from 'path';
import { Property } from '@/types/property';

interface RawPropertyData {
  property_id: string;
  url: string;
  location: string;
  price: number;
  scraped_at: string;
  perplexity_rating: number | null;
  calculated_monthly_payment: number | null;
  perplexity_analysis: string | null;
  description?: string;
  tenure?: string;
  heating?: string;
  property_type?: string;
  energy_rating?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  distance_to_destination?: number;
  [key: string]: unknown;
}

interface GeocodingCache {
  [location: string]: {
    coords: [number, number];
    cached_at: string;
  };
}

function computeMortgage(price: number): number {
  const principal = price - 15000;
  if (principal <= 0) return 0;
  const monthlyRate = 0.04 / 12;
  const n = 40 * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function loadGeocodingCache(): GeocodingCache {
  try {
    const cachePath = path.join(process.cwd(), '..', 'data', 'cache', 'geocoding_cache.json');
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  } catch {
    return {};
  }
}

export async function loadProperties(): Promise<Property[]> {
  const filePath = path.join(process.cwd(), 'public', 'demo-data.json');
  const rawData: RawPropertyData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!Array.isArray(rawData)) {
    throw new Error('Invalid data format: expected array of properties');
  }

  const geoCache = loadGeocodingCache();

  return rawData.map((raw) => {
    const monthly = raw.calculated_monthly_payment ?? computeMortgage(raw.price);
    const locationKey = raw.location.toLowerCase();
    const geo = geoCache[locationKey];

    return {
      property_id: raw.property_id,
      url: raw.url,
      location: raw.location,
      price: raw.price,
      perplexity_rating: raw.perplexity_rating ?? null,
      calculated_monthly_payment: monthly,
      perplexity_analysis: raw.perplexity_analysis ?? null,
      scraped_at: raw.scraped_at,
      description: raw.description,
      tenure: raw.tenure,
      heating: raw.heating,
      property_type: raw.property_type,
      energy_rating: raw.energy_rating,
      bedrooms: raw.bedrooms,
      bathrooms: raw.bathrooms,
      size: raw.size,
      distance_to_destination: raw.distance_to_destination ?? null,
      lat: geo?.coords?.[0],
      lng: geo?.coords?.[1],
    };
  });
}

export function getLatestDataTimestamp(): string {
  return '20260220_083859';
}
