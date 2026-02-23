'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  dataTimestamp: string;
}

function formatTimestamp(ts: string): string {
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : ts;
}

export default function Header({ dataTimestamp }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">PropertyPal Analyser</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
            Data: {formatTimestamp(dataTimestamp)}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
