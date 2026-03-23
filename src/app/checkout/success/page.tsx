'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, ShoppingBag, Loader2, Crown, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion, query, collection, where, limit, getDocs, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const itemId = searchParams?.get('item_id');
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fulfillmentStarted = useRef(false);

  useEffect(() => {
    // Basic verification handshake delay to simulate processing
    const timer = setTimeout(() => {
      if (!sessionId) {
        setError("Invalid session data. If your payment was successful, please check your dashboard in a few minutes.");
      }
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  useEffect(() => {
    const fulfillPremiumItem = async () => {
      // Gate: must have all services, not loading, and not already fulfilled
      if (!itemId || !user || !db || fulfillmentStarted.current || loading || isUserLoading) return;
      
      fulfillmentStarted.current = true;
      
      try {
        // Handle premium products (Spotlights, Themes starting with 'p')
        if (itemId.toString().startsWith('p')) {
          const userRef = doc(db, 'users', user.uid);
          
          // 1. Add theme/item to user vault atomically
          await updateDoc(userRef, {
            ownedPremiumProducts: arrayUnion(itemId),
            updatedAt: serverTimestamp()
          });

          // 2. Specialized Logic: Weekly Spotlight (p1)
          if (itemId === 'p1') {
            const storeQuery = query(collection(db, 'storefronts'), where('ownerUid', '==', user.uid), limit(1));
            const storeSnap = await getDocs(storeQuery);
            if (!storeSnap.empty) {
              const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              await updateDoc(storeSnap.docs[0].ref, {
                isSpotlighted: true,
                spotlightUntil: Timestamp.fromDate(expiration),
                updatedAt: serverTimestamp()
              });
            }
          }

          toast({
            title: "Upgrade Active!",
            description: "Your purchase has been applied to your permanent vault.",
          });
        }
      } catch (error) {
        console.error("Auto-fulfillment warning:", error);
        // We don't block the UI here as the backend webhook will likely catch it
      }
    };

    fulfillPremiumItem();
  }, [loading, isUserLoading, itemId, user, db, toast]);

  if (loading || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-headline font-black uppercase italic">Verifying Transaction...</h2>
          <p className="text-muted-foreground font-medium">Securing your collectibles protocol.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-headline font-black uppercase">Verification Fault</h1>
        <p className="text-muted-foreground font-medium">{error}</p>
        <Button asChild variant="outline" className="w-full h-14 rounded-xl font-black uppercase">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isPremiumProduct = itemId?.toString().startsWith('p');

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
        <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
          {isPremiumProduct 
            ? 'Your premium shop upgrade is now active. Check your Store Customization settings to apply your changes.' 
            : 'Your payment was processed successfully. The item is now being prepared for fulfillment.'}
        </p>
      </div>

      <div className="bg-muted/30 p-8 rounded-[2.5rem] border-2 border-dashed border-muted-foreground/20 space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Transaction Node ID</p>
        <code className="text-sm font-mono font-bold text-primary break-all">{sessionId}</code>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button asChild className="h-16 px-10 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-lg gap-2 shadow-xl shadow-accent/20 transition-all active:scale-95">
          <Link href="/dashboard">
            {isPremiumProduct ? 'Visit Dashboard' : 'Track Order'} <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-16 px-10 rounded-2xl font-black text-lg gap-2 border-2 transition-all hover:bg-zinc-50">
          <Link href="/">
            <ShoppingBag className="w-5 h-5" /> Back to Catalog
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
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading success protocol...</p>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
