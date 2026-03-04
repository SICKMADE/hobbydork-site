'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl mb-4 overflow-hidden">
          <img src="/fail.jpg" alt="System Fault" className="object-cover w-full h-full" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black italic tracking-tighter uppercase leading-none text-primary">
            System Fault
          </h1>
          <p className="text-muted-foreground font-medium">
            Something went wrong inside hobbydork. Our team has been alerted.
          </p>
        </div>

        <div className="bg-zinc-900/80 dark:bg-zinc-900/80 p-6 rounded-[2rem] border-2 border-dashed border-red-200 text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Diagnostic Log</p>
          <p className="text-xs font-mono font-bold break-words text-red-200">
            {getFriendlyErrorMessage(error)}
          </p>
          {error.digest && (
            <p className="text-[8px] font-mono mt-2 text-muted-foreground dark:text-zinc-400 uppercase">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="h-14 bg-primary text-white hover:bg-primary/90 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 dark:bg-accent dark:text-zinc-900 dark:hover:bg-accent/80"
          >
            <RotateCcw className="w-5 h-5" /> Try Reboot
          </Button>
          <Button asChild variant="outline" className="h-14 rounded-2xl border-2 font-black text-lg gap-2">
            <Link href="/">
              <Home className="w-5 h-5" /> Return to Catalog
            </Link>
          </Button>
        </div>
        
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          hobbydork standard error protocol
        </p>
      </div>
    </div>
  );
}
