import {
  Property,
  PropertyWithPriority,
  AlgorithmWeights,
} from "@/types/property";

// Weights: Location is dominant (60%), but we keep others to avoid "Money Pits"
export const DEFAULT_WEIGHTS: AlgorithmWeights = {
  location: 0.6, // Top Priority
  price: 0.1, // Low priority as requested
  monthly: 0.2, // Kept to penalize Oil/Electric heating
  rating: 0.1, // Kept for condition checks
};

export function calculatePriorityScores(
  properties: Property[],
  weights = DEFAULT_WEIGHTS
): PropertyWithPriority[] {
  const maxPrice = 140000;

  return properties
    .map((p) => {
      // --- 1. KILL SWITCHES ---
      // Immediate rejection for Cash Only or Short Lease
      if (p.description?.toLowerCase().includes("cash offers only"))
        return { ...p, priority_score: -1 };

      const yearsRemaining = p.lease_years ?? 999;
      if (p.tenure === "Leasehold" && yearsRemaining < 60)
        return { ...p, priority_score: -1 };

      // --- 2. LOCATION SCORE (The Priority) ---
      // Target: 10 minute walk (~0.5 - 0.6 miles)
      const distanceKm = p.distance_to_destination;
      // Convert km to miles (default to 5 miles if data missing to penalize it)
      const dist = distanceKm ? distanceKm * 0.621371 : 5.0;

      let locationScore = 0;

      // TIER 1: The "10-Minute Walk" (0 - 0.6 miles)
      // Score: 100 (Perfect)
      if (dist <= 0.6) {
        locationScore = 100;
      }
      // TIER 2: The "30-Minute Walk" (0.6 - 1.5 miles)
      // Score: Decays rapidly from 100 -> 40
      else if (dist <= 1.5) {
        // Normalize range 0.6-1.5 to score 100-40
        const range = 1.5 - 0.6; // 0.9
        const progress = (dist - 0.6) / range;
        locationScore = 100 - progress * 60;
      }
      // TIER 3: The "Commute" (> 1.5 miles)
      // Score: Low (40 -> 0)
      else {
        locationScore = Math.max(0, 40 - (dist - 1.5) * 10);
      }

      // --- 3. REAL MONTHLY COST SCORE ---
      // Even if location is key, we must penalize expensive heating
      let monthlyPenalty = 0;
      if (p.heating === "Oil") monthlyPenalty += 60;
      if (p.heating === "Electric") monthlyPenalty += 100;

      const realMonthly = (p.calculated_monthly_payment || 0) + monthlyPenalty;
      const monthlyScore = Math.max(0, (1 - realMonthly / 800) * 100);

      // --- 4. PRICE SCORE ---
      const priceScore = p.price ? Math.max(0, (1 - p.price / maxPrice) * 100) : 0;

      // --- 5. QUALITY SCORE ---
      let qualityScore = (p.perplexity_rating ?? 5) * 10;
      if (p.energy_rating?.startsWith("B")) qualityScore += 20;
      if (p.property_type?.toLowerCase().includes("house")) qualityScore += 10;
      qualityScore = Math.min(100, Math.max(0, qualityScore));

      // --- 6. FINAL CALCULATION ---
      const finalScore =
        locationScore * weights.location +
        priceScore * weights.price +
        monthlyScore * weights.monthly +
        qualityScore * weights.rating;

      return {
        ...p,
        priority_score: Number(finalScore.toFixed(1)),
        // Debugging: Return individual factors if needed
        location_score: Math.round(locationScore),
      };
    })
    .filter((p) => p.priority_score !== -1)
    .sort((a, b) => b.priority_score - a.priority_score);
}
