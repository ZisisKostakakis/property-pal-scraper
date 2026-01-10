export interface Property {
  property_id: string;
  url: string;
  location: string;
  price: number;
  perplexity_rating: number | null;
  calculated_monthly_payment: number | null;
  perplexity_analysis: string | null;
  scraped_at: string;
  description?: string;
  tenure?: string;
  heating?: string;
  property_type?: string;
  energy_rating?: string;
  lease_years?: number;
  features?: string[];
  distance_from_center?: number;
  distance_to_destination?: number;
}

export interface PropertyWithPriority extends Property {
  priority_score: number;
  price_factor?: number;
  monthly_factor?: number;
  rating_factor?: number;
}

export interface AlgorithmWeights {
  price: number;
  location: number;
  monthly: number;
  rating: number;
}
