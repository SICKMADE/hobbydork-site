'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-accent/10 rounded-3xl mb-4">
          <Ghost className="w-12 h-12 text-accent" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black italic tracking-tighter uppercase leading-none">
            Lost in the lobby
          </h1>
          <p className="text-muted-foreground font-medium">
            The item or page you are looking for has been moved, de-listed, or never existed in this timeline.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="h-14 bg-accent text-white hover:bg-accent/90 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2">
            <Link href="/">
              <Home className="w-5 h-5" /> Back to Home
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()} className="h-14 rounded-2xl font-black text-lg gap-2">
            <ArrowLeft className="w-5 h-5" /> Previous Screen
          </Button>
        </div>
        
        <div className="pt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Error 404 • Resource Not Located
          </p>
        </div>
      </div>
    </div>
  );
}
