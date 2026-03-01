'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const listingId = searchParams?.get('listing');
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const listingRef = listingId && db ? doc(db, 'listings', listingId) : null;
  const { data: listing } = useDoc(listingRef);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  const handleCheckout = async () => {
    if (!listing || !user || !db) return;

    setProcessing(true);
    setError('');

    try {
      // Create order first
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Call createCheckoutSession cloud function
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const result = await createCheckoutSession({
        orderId,
        listingId: listing.id,
        listingTitle: listing.title,
        amountCents: Math.round(listing.price * 100),
        appBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://hobbydork.com',
      });

      const { url } = result.data as { url: string };
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initiate checkout');
      toast({
        title: "Checkout Error",
        description: err.message || 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 p-6 rounded-2xl text-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
            <p className="text-red-800 dark:text-red-200 font-semibold">Listing not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-accent to-accent/80 p-6 md:p-8 text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase tracking-tight">Checkout</h1>
          </div>
          
          <div className="p-6 md:p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                <div className="flex-1">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Item</p>
                  <p className="font-black text-lg">{listing.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Price</p>
                  <p className="font-black text-2xl text-accent">${listing.price}</p>
                </div>
              </div>

              <div className="p-4 bg-secondary/10 rounded-xl border border-border">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Seller</p>
                <p className="font-bold text-sm">@{listing.sellerName || listing.seller}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 p-4 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <Button 
              onClick={handleCheckout} 
              disabled={processing}
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg shadow-xl rounded-xl transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Proceed to Payment - $${listing.price}`
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
