'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { cn } from '@/lib/utils';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const listingId = searchParams?.get('listing');
  const existingOrderId = searchParams?.get('order');
  const amountFromQuery = Number(searchParams?.get('amount') || 0);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const listingRef = listingId && db ? doc(db, 'listings', listingId) : null;
  const { data: listing } = useDoc(listingRef);
  const checkoutAmountCents = amountFromQuery > 0 ? amountFromQuery : Math.round((listing?.price || 0) * 100);
  const checkoutAmountDollars = checkoutAmountCents / 100;
  const isAuctionWinner = !!(user && listing?.winnerUid === user.uid && listing?.paymentStatus === 'PENDING');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  const handleCheckout = async () => {
    if (!listing || !user || !db) return;

    if (listing.type === 'Auction' && !isAuctionWinner) {
      setError('Only the winning bidder can complete auction payment.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const orderId = existingOrderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Call createCheckoutSession cloud function
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const result = await createCheckoutSession({
        orderId,
        listingId: listing.id,
        listingTitle: listing.title,
        amountCents: checkoutAmountCents,
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
      <main className="container mx-auto px-2 sm:px-4 py-6 max-w-2xl">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-accent to-accent/80 p-4 sm:p-6 md:p-8 text-white">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-headline font-black uppercase tracking-tight">Checkout</h1>
          </div>
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 p-3 sm:p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                <div className="flex-1">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1 sm:mb-2">Item</p>
                  <p className="font-black text-base sm:text-lg">{listing.title}</p>
</div>
<div className="text-right">
  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Price</p>
  <p className="font-black text-2xl text-accent">${checkoutAmountDollars.toLocaleString()}</p>
</div>
              </div>

              <div className="p-3 sm:p-4 bg-secondary/10 rounded-xl border border-border">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1 sm:mb-2">Seller</p>
                <p className="font-bold text-sm">@{listing.sellerName || listing.seller}</p>
              </div>

              {/* Item Condition Section */}
              {/* Grading condition section removed */}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 p-3 sm:p-4 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <Button 
  onClick={handleCheckout} 
  disabled={processing || (listing.type === 'Auction' && !isAuctionWinner)}
  className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg shadow-xl rounded-xl transition-all"
>
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Proceed to Payment - $${checkoutAmountDollars.toLocaleString()}`
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
