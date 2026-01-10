'use client';

import { PropertyWithPriority } from '@/types/property';
import {
  formatPrice,
  formatMonthly,
  getRatingColor,
  getRatingBgColor,
  getPriorityBadgeColor,
} from '@/lib/utils';

interface PropertyCardProps {
  property: PropertyWithPriority;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700 p-6">
      {/* Priority Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityBadgeColor(
            property.priority_score
          )}`}
          title={property.price_factor !== undefined && property.monthly_factor !== undefined && property.rating_factor !== undefined
            ? `Price: ${property.price_factor}, Monthly: ${property.monthly_factor}, Rating: ${property.rating_factor}`
            : undefined}
        >
          {isNaN(property.priority_score) ? 'N/A' : property.priority_score}
        </span>
      </div>

      {/* Price */}
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatPrice(property.price)}
        </h2>
      </div>

      {/* Monthly Payment */}
      <div className="mb-3">
        <p className="text-lg text-gray-600 dark:text-gray-300">{formatMonthly(property.monthly_payment)}</p>
      </div>

      {/* Rating */}
      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${property.perplexity_rating ? getRatingBgColor(
            property.perplexity_rating
          ) : 'bg-gray-50'} ${property.perplexity_rating ? getRatingColor(property.perplexity_rating) : 'text-gray-500'}`}
        >
          ⭐ {property.perplexity_rating ?? 'N/A'}/10
        </span>
      </div>

      {/* Location */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          {property.location}
        </p>
      </div>

      {/* Analysis Full Text */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
          {property.analysis}
        </p>
      </div>

      {/* All JSON Data */}
      <details className="mb-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Show all data
        </summary>
        <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-auto max-h-96 text-gray-800 dark:text-gray-200">
          {JSON.stringify(property, null, 2)}
        </pre>
      </details>

      {/* View Details Link */}
      <div>
        <a
          href={property.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        >
          View on PropertyPal
        </a>
      </div>
    </div>
  );
}
