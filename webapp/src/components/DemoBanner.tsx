'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <Alert className="mx-4 mt-2 flex items-center justify-between border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
          Demo mode — showing a real data snapshot from 2026-02-20. AI condition ratings coming soon.
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-amber-600 hover:text-amber-800"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  );
}
