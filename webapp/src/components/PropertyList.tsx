'use client';

import { useState } from 'react';
import { Property, PropertyWithPriority, AlgorithmWeights } from '@/types/property';
import { calculatePriorityScores } from '@/lib/priorityAlgorithm';
import PropertyCard from './PropertyCard';

interface PropertyListProps {
  properties: PropertyWithPriority[];
  rawProperties: Property[];
}

export default function PropertyList({ properties: initialProperties, rawProperties }: PropertyListProps) {
  const [weights, setWeights] = useState<AlgorithmWeights>({
    location: 0.6,
    price: 0.1,
    monthly: 0.2,
    rating: 0.1,
  });

  // Recalculate priorities when weights change
  const prioritizedProperties = calculatePriorityScores(rawProperties, weights);

  const updateWeight = (key: keyof AlgorithmWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    // Ensure weights sum to 1
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      const normalizedWeights = Object.fromEntries(
        Object.entries(newWeights).map(([k, v]) => [k, v / total])
      ) as AlgorithmWeights;
      setWeights(normalizedWeights);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {prioritizedProperties.length} {prioritizedProperties.length === 1 ? 'property' : 'properties'} sorted by priority score
        </p>
      </div>

      {/* Weight Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Algorithm Weights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Weight: {(weights.location * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weights.location}
              onChange={(e) => updateWeight('location', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price Weight: {(weights.price * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weights.price}
              onChange={(e) => updateWeight('price', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monthly Cost Weight: {(weights.monthly * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weights.monthly}
              onChange={(e) => updateWeight('monthly', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating Weight: {(weights.rating * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weights.rating}
              onChange={(e) => updateWeight('rating', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Adjust the sliders to change how much each factor influences the priority score. The values will automatically normalize to sum to 100%.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prioritizedProperties.map((property) => (
          <PropertyCard key={property.property_id} property={property} />
        ))}
      </div>

      {prioritizedProperties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No properties found</p>
        </div>
      )}
    </div>
  );
}
