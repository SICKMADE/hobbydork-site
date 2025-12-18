'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { getFunctions, httpsCallable } from 'firebase/functions';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import {
  MessageSquare,
  Package,
} from 'lucide-react';

import ListingCard from '@/components/ListingCard';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const listingId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Listing
  const listingRef = useMemoFirebase(() => {
    if (!firestore || !listingId) return null;
    return doc(firestore, 'listings', listingId);
  }, [firestore, listingId]);

  const { data: listing, isLoading } = useDoc(listingRef);

  // Similar items
  const similarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'listings'),
      where('state', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(12),
    );
  }, [firestore]);

  const { data: similarListings } = useCollection(similarQuery);

  const active = listing;
  const isOwner = user && user.uid === active?.ownerUid;
  const quantityAvailable = Number(active?.quantityAvailable ?? 1);
  const isSoldOut =
    active?.state === 'SOLD_OUT' || quantityAvailable <= 0;

  const price = Number(active?.price ?? 0);

  // 🔥 STRIPE BUY NOW — THIS IS THE FIX
  const handleBuyNow = async () => {
    if (!firestore || !user || !active) return;

    try {
      setBuying(true);
      console.log('BUY NOW CLICKED');

      // 1️⃣ Create order (unpaid)
      const orderRef = await addDoc(collection(firestore, 'orders'), {
        buyerUid: user.uid,
        sellerUid: active.ownerUid,
        storeId: active.storeId,
        items: [
          {
            listingId,
            title: active.title,
            quantity,
            price,
          },
        ],
        subtotal: price * quantity,
        state: 'PENDING_PAYMENT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('ORDER CREATED', orderRef.id);

      // 2️⃣ Call Stripe Cloud Function (EXPLICIT APP + REGION)
      const functions = getFunctions(undefined, 'us-central1');
      const createCheckoutSession = httpsCallable(
        functions,
        'createCheckoutSession'
      );

      const res = await createCheckoutSession({
        orderId: orderRef.id,
        listingTitle: active.title,
        amountCents: Math.round(price * quantity * 100),
        appBaseUrl: window.location.origin,
      });

      console.log('STRIPE RESPONSE', res.data);

      // 3️⃣ Redirect to Stripe
      const url = res?.data?.url;
      if (!url) {
        throw new Error('Stripe checkout URL missing');
      }
      window.location.href = url;
    } catch (err) {
      console.error('BUY NOW ERROR', err);
      toast({
        title: 'Checkout failed',
        description: err?.message ?? 'Stripe error',
        variant: 'destructive',
      });
      setBuying(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!active) {
    return (
      <AppLayout>
        <div className="p-6">Listing not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        {/* TOP */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* IMAGE */}
          <Card>
            <CardContent className="p-0">
              <div className="h-[420px] bg-black flex items-center justify-center">
                <img
                  src={active.primaryImageUrl || '/placeholder.png'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* BUY BOX */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{active.title}</h1>

            <div className="text-3xl font-bold">
              ${price.toFixed(2)}
            </div>

            <Separator />

            <Card>
              <CardContent className="space-y-3 p-4">
                {!isOwner && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Qty</span>
                      <input
                        type="number"
                        min={1}
                        max={quantityAvailable}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Number(e.target.value))
                        }
                        className="w-20 border rounded px-2"
                      />
                    </div>

                    <Button
                      onClick={handleBuyNow}
                      disabled={buying || isSoldOut}
                      className="w-full h-12 text-lg"
                    >
                      {buying ? 'Redirecting…' : 'Buy It Now'}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link
                        href={`/messages/new?sellerUid=${active.ownerUid}&storeId=${active.storeId}`}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message seller
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* DESCRIPTION */}
        <section>
          <h2 className="text-lg font-semibold mb-2">
            Description
          </h2>
          <p className="text-sm whitespace-pre-line">
            {active.description || 'No description.'}
          </p>
        </section>

        {/* SIMILAR */}
        {similarListings && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Similar items
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarListings
                .filter((l) => l.id !== listingId)
                .slice(0, 8)
                .map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
