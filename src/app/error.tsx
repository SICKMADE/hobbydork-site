
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  const errorImage = PlaceHolderImages.find(img => img.id === 'error-fail');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl mb-4 overflow-hidden border-2 border-dashed border-red-600/20">
          <Image 
            src={"/fail.jpg"} 
            alt="System Fault" 
            data-ai-hint={errorImage?.imageHint || "static glitch"}
            width={128}
            height={128}
            className="object-cover w-full h-full grayscale brightness-50" 
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black italic tracking-tighter uppercase leading-none text-primary">
            System Fault
          </h1>
          <p className="text-muted-foreground font-medium">
            Something went wrong inside hobbydork. Our team has been alerted.
          </p>
        </div>

        <div className="bg-zinc-950 p-6 rounded-[2rem] border-2 border-dashed border-red-600/20 text-left relative overflow-hidden">
          <div className="absolute inset-0 hardware-grid-overlay opacity-5" />
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 relative z-10">Diagnostic Log</p>
          <p className="text-xs font-mono font-bold break-words text-red-200 relative z-10">
            {getFriendlyErrorMessage(error)}
          </p>
          {error.digest && (
            <p className="text-[8px] font-mono mt-2 text-zinc-500 uppercase relative z-10">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="h-14 bg-primary text-white hover:bg-primary/90 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Try Reboot
          </Button>
          <Button asChild variant="outline" className="h-14 rounded-2xl border-2 font-black text-lg gap-2">
            <Link href="/">
              <Home className="w-5 h-5" /> Return to Catalog
            </Link>
          </Button>
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          hobbydork standard error protocol
        </p>
      </div>
    </div>
  );
}
