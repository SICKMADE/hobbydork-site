'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, ShoppingBag, Loader2, Crown } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session_id');
  const itemId = searchParams?.get('item_id');
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const fulfillmentStarted = useRef(false);

  useEffect(() => {
    // Simulate verifying the session
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  useEffect(() => {
    const fulfillPremiumItem = async () => {
      if (!itemId || fulfillmentStarted.current) return;
      
      fulfillmentStarted.current = true;
      
      // Prototype Persistence: Save owned items to localStorage
      const ownedItems = JSON.parse(localStorage.getItem('hobbydork_owned_items') || '[]');
      if (!ownedItems.includes(itemId)) {
        ownedItems.push(itemId);
        localStorage.setItem('hobbydork_owned_items', JSON.stringify(ownedItems));
      }
      
      toast({
        title: "Upgrade Active!",
        description: "Your purchase has been applied to your profile.",
      });
    };

    if (!loading) {
      fulfillPremiumItem();
    }
  }, [loading, itemId, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-headline font-black uppercase italic">Verifying Payment...</h2>
          <p className="text-muted-foreground font-medium">Processing your transaction securely.</p>
        </div>
      </div>
    );
  }

  const isPremiumProduct = itemId?.startsWith('p');

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-10 animate-in zoom-in duration-500">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
        <div className="relative w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
          {isPremiumProduct ? <Crown className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-headline font-black italic tracking-tighter uppercase leading-none">
          {isPremiumProduct ? 'Upgrade Secured!' : 'Payment Complete!'}
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto">
          {isPremiumProduct 
            ? 'Your premium shop upgrade is now active. Check your Store Customization settings.' 
            : 'Your payment was processed successfully. The item is now yours.'}
        </p>
      </div>

      <div className="bg-muted/30 p-8 rounded-[2.5rem] border-2 border-dashed border-muted-foreground/20 space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Transaction ID</p>
        <code className="text-sm font-mono font-bold text-primary">{sessionId}</code>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button asChild className="h-16 px-10 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-lg gap-2 shadow-xl shadow-accent/20">
          <Link href="/dashboard">
            {isPremiumProduct ? 'Visit Dashboard' : 'Track Order'} <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-16 px-10 rounded-2xl font-black text-lg gap-2 border-2">
          <Link href="/">
            <ShoppingBag className="w-5 h-5" /> Continue Browsing
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto">
        <Suspense fallback={
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
