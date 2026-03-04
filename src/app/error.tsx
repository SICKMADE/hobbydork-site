'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-background dark:bg-[#18181b] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500 bg-white dark:bg-[#23272f] rounded-3xl shadow-xl p-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900 rounded-3xl mb-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black italic tracking-tighter uppercase leading-none text-primary">
            System Fault
          </h1>
          <p className="text-muted-foreground font-medium">
            Something went wrong inside hobbydork. Our team has been alerted.
          </p>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-[2rem] border-2 border-dashed border-red-200 dark:border-red-700 text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Diagnostic Log</p>
          <p className="text-xs font-mono font-bold break-words text-primary dark:text-red-200">
            {error.message || "Unknown internal error occurred during render."}
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
            className="error-reboot-btn h-14 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2"
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
