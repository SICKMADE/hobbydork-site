'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable, getFunctions } from 'firebase/functions';
import Image from 'next/image';

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
  const [imgSrc, setImgSrc] = useState<string>('/defaultbroken.jpg');

  const listingRef = listingId && db ? doc(db, 'listings', listingId) : null;
  const { data: listing } = useDoc(listingRef);
  
  // Total logic: (Item Price OR Bid) + Listing Shipping Cost
  const itemAmountCents = amountFromQuery > 0 ? amountFromQuery : Math.round((listing?.price || 0) * 100);
  const shippingAmountCents = Math.round((listing?.shippingCost || 0) * 100);
  const totalAmountCents = itemAmountCents + shippingAmountCents;
  
  const isAuctionWinner = !!(user && listing?.winnerUid === user.uid && listing?.paymentStatus === 'PENDING');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  useEffect(() => {
    if (listing?.imageUrl) {
      setImgSrc(listing.imageUrl);
    }
  }, [listing]);

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
      
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const result = await createCheckoutSession({
        orderId,
        listingId: listing.id,
        listingTitle: listing.title,
        amountCents: totalAmountCents,
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-black uppercase">Listing not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-card rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
          <div className="bg-primary p-10 text-primary-foreground">
            <h1 className="text-3xl font-headline font-black uppercase italic tracking-tight">Securing Asset</h1>
            <p className="text-primary-foreground/60 font-medium mt-1">Finalizing trade protocol via Stripe Connect.</p>
          </div>
          
          <div className="p-10 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-dashed">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted border">
                  <Image 
                    src={imgSrc} 
                    alt={listing.title} 
                    fill 
                    className="object-cover" 
                    onError={() => setImgSrc('/defaultbroken.jpg')}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Asset</p>
                  <h3 className="text-xl font-black">{listing.title}</h3>
                </div>
                <p className="text-xl font-black">${(itemAmountCents / 100).toLocaleString()}</p>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                <p className="uppercase tracking-widest text-[10px]">Carrier Protocol (Shipping)</p>
                <p>{shippingAmountCents > 0 ? `$${(shippingAmountCents / 100).toFixed(2)}` : 'FREE'}</p>
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl flex justify-between items-center">
                <p className="font-black uppercase tracking-widest text-xs">Total Due</p>
                <p className="text-3xl font-black text-primary">${(totalAmountCents / 100).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <p className="text-xs font-bold text-green-800">Your payment is held in escrow until delivery is verified.</p>
            </div>

            {error && <p className="text-red-600 font-black uppercase text-[10px] text-center italic">{error}</p>}

            <Button 
              onClick={handleCheckout} 
              disabled={processing || (listing.type === 'Auction' && !isAuctionWinner)}
              className="w-full h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-2xl rounded-2xl shadow-xl uppercase italic tracking-tighter"
            >
              {processing ? <Loader2 className="animate-spin" /> : "Initiate Checkout"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
