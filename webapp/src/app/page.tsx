import { loadProperties, getLatestDataTimestamp } from '@/lib/dataLoader';
import { calculatePriorityScores } from '@/lib/priorityAlgorithm';
import PropertyList from '@/components/PropertyList';
import { Property, PropertyWithPriority } from '@/types/property';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  let properties: PropertyWithPriority[] = [];
  let dataTimestamp: string | null = null;
  let error: string | null = null;

  let rawProperties: Property[] = [];

  try {
    rawProperties = await loadProperties();
    properties = calculatePriorityScores(rawProperties);
    dataTimestamp = getLatestDataTimestamp();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load properties';
    properties = [];
    rawProperties = [];
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          PropertyPal Best Value Properties
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
          Properties sorted by priority algorithm based on price, monthly payment, and AI rating
        </p>
        {dataTimestamp && (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Data from: {dataTimestamp.replace('_', ' at ').replace(/(\d{2})(\d{2})(\d{2})$/, '$1:$2:$3')}
          </p>
        )}
      </header>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-2">
            Please ensure the scraper has run and data files exist in ../data/ratings/
          </p>
        </div>
      ) : (
        <PropertyList properties={properties} rawProperties={rawProperties} />
      )}
    </main>
  );
}
