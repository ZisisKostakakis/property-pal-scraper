import { loadProperties, getLatestDataTimestamp } from '@/lib/dataLoader';
import AppShell from '@/components/AppShell';
import { Property } from '@/types/property';

export const revalidate = 300;

export default async function Home() {
  let rawProperties: Property[] = [];
  let error: string | null = null;
  const dataTimestamp = getLatestDataTimestamp();

  try {
    rawProperties = await loadProperties();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load properties';
  }

  if (error) {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </main>
    );
  }

  return <AppShell rawProperties={rawProperties} dataTimestamp={dataTimestamp} />;
}
