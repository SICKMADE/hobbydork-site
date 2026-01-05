"use client";
import { DocumentData } from "firebase/firestore";

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
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
import { getApp } from 'firebase/app';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import {
  Store as StoreIcon,
  MessageSquare,
  Package,
} from 'lucide-react';
import ListingCard from '@/components/ListingCard';

/* ---------------- TYPES ---------------- */

type Listing = {
  title: string;
  description?: string;
  price: number;
  category: string;
  condition?: string;
  storeId: string;
  ownerUid: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  quantityAvailable?: number;
  state: string;
  createdAt?: any;
};

type Storefront = {
  storeName: string;
  ownerUid: string;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
};

/* =============================== */
/* PAGE                            */
/* =============================== */

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const { user, profile, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return null;
  if (!profile?.emailVerified) return null;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [redirecting, setRedirecting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /* ---------- LISTING ---------- */

  // Only create refs and call useDoc when auth/profile are ready
  const canQuery = !authLoading && user && profile && profile.uid && profile.emailVerified && profile.status === "ACTIVE";

  const listingRef = useMemoFirebase(() => {
    if (!canQuery || !firestore || !listingId) return null;
    return doc(firestore, 'listings', listingId);
  }, [canQuery, firestore, listingId]);


  const { data: listing, isLoading } = useDoc<Listing>(canQuery ? listingRef : null);
  // Memoize activeListing to prevent re-creation on every render
  const activeListing = useMemo(() => listing as any, [listing]);

  /* ---------- STORE ---------- */


  const storeId = activeListing?.storeId;
  const storeRef = useMemoFirebase(() => {
    if (!canQuery || !firestore || !storeId) return null;
    return doc(firestore, 'storefronts', storeId);
  }, [canQuery, firestore, storeId]);

  const { data: store } = useDoc<Storefront>(canQuery ? storeRef : null);

  /* ---------- IMAGES (RESTORED) ---------- */

  const imageUrls: string[] = (() => {
    if (!activeListing) return [];
    const urls: string[] = [];
    if (activeListing.primaryImageUrl) {
      urls.push(activeListing.primaryImageUrl);
    }
    if (Array.isArray(activeListing.imageUrls)) {
      for (const u of activeListing.imageUrls) {
        if (u && u !== activeListing.primaryImageUrl) {
          urls.push(u);
        }
      }
    }
    return urls;
  })();

  const mainImageUrl =
    imageUrls[selectedImageIndex] ?? imageUrls[0];

  /* ---------- DERIVED ---------- */

  const price = Number(activeListing?.price ?? 0);
  const quantityAvailable = Number(activeListing?.quantityAvailable ?? 1);
  const isSoldOut =
    activeListing?.state !== 'ACTIVE' || quantityAvailable <= 0;

  const isOwner = user?.uid === activeListing?.ownerUid;

  /* ---------- SIMILAR ---------- */


  const category = activeListing?.category;
  const similarQuery = useMemoFirebase(() => {
    if (!canQuery || !firestore || !category) return null;
    return query(
      collection(firestore, 'listings'),
      where('state', '==', 'ACTIVE'),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
  }, [canQuery, firestore, category]);

  const similarQueryWithConverter = useMemo(() => {
    if (canQuery && similarQuery) {
      return similarQuery.withConverter<Listing>({
        toFirestore: (listing) => listing as DocumentData,
        fromFirestore: (snap) => snap.data() as Listing,
      });
    }
    return null;
  }, [canQuery, similarQuery]);
  const { data: similarListings } = useCollection<Listing>(similarQueryWithConverter);

  /* ---------- BUY NOW (STRIPE) ---------- */

  const handleBuyNow = async () => {
    // Helpful breadcrumb for debugging click -> redirect.
    // eslint-disable-next-line no-console
    console.info('[checkout] buyNow click', {
      hasUser: !!user,
      hasFirestore: !!firestore,
      hasListing: !!activeListing,
      isOwner,
      isSoldOut,
    });

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to continue to Stripe checkout.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!firestore) {
      toast({
        title: 'Checkout unavailable',
        description: 'Firestore is not ready yet. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!activeListing) {
      toast({
        title: 'Listing not ready',
        description: 'Please wait for the listing to load and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (isOwner) {
      toast({
        title: 'Not allowed',
        description: 'You can’t purchase your own listing.',
        variant: 'destructive',
      });
      return;
    }

    if (isSoldOut) {
      toast({
        title: 'Sold out',
        description: 'This item is not available for purchase.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRedirecting(true);

      // eslint-disable-next-line no-console
      console.info('[checkout] creating order doc');

      const orderRef = await addDoc(collection(firestore, 'orders'), {
        buyerUid: user.uid,
        sellerUid: activeListing.ownerUid,
        storeId: activeListing.storeId,
        items: [
          {
            listingId,
            title: activeListing.title,
            quantity,
            price,
          },
        ],
        subtotal: price * quantity,
        state: 'PENDING_PAYMENT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // eslint-disable-next-line no-console
      console.info('[checkout] order created', { orderId: orderRef.id });

      let res: any = null;
      if (typeof window !== "undefined") {
        const functions = getFunctions(getApp(), 'us-central1');
        const createCheckoutSession = httpsCallable(
          functions,
          'createCheckoutSession'
        );
        res = await createCheckoutSession({
          orderId: orderRef.id,
          amountCents: Math.round(price * quantity * 100),
          listingTitle: activeListing.title,
          appBaseUrl: window.location.origin,
        });
      } else {
        throw new Error("Cloud Functions are not available. Please try again in the browser.");
      }

      // eslint-disable-next-line no-console
      console.info('[checkout] createCheckoutSession response', res?.data);

      const url = res?.data?.url;
      if (!url) {
        throw new Error('Stripe checkout URL missing');
      }

      window.location.href = url;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[checkout] buyNow failed', err);
      toast({
        title: 'Checkout failed',
        description: err?.message ?? 'Stripe error',
        variant: 'destructive',
      });
      setRedirecting(false);
    }
  };

  /* ---------- LOADING / ERROR ---------- */

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Spinner size={48} />
        </div>
      </AppLayout>
    );
  }

  if (!activeListing) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Listing not found"
          description="This item may no longer exist."
        />
      </AppLayout>
    );
  }

  /* ---------- RENDER ---------- */

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        <div className="grid lg:grid-cols-2 gap-8">

          {/* IMAGE */}
          <div>
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-muted">
                  {mainImageUrl ? (
                    <Image
                      src={mainImageUrl}
                      alt={activeListing.title}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {imageUrls.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {imageUrls.map((url, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-20 w-20 border rounded ${
                      idx === selectedImageIndex
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="space-y-4">

            <div className="flex gap-2">
              <Badge>{activeListing.category}</Badge>
              {activeListing.condition && (
                <Badge variant="outline">
                  {activeListing.condition}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold">
              {activeListing.title}
            </h1>

            <div className="text-3xl font-bold text-green-500">
              ${price.toFixed(2)}
            </div>

            <Separator />

            <Card>
              <CardContent className="space-y-3 py-4">
                <div className="flex justify-between">
                  <span>Qty</span>
                  <input
                    type="number"
                    min={1}
                    max={quantityAvailable}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(quantityAvailable, Number(e.target.value))
                        )
                      )
                    }
                    className="w-20 border rounded px-2 py-1"
                    placeholder="Qty"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={redirecting || isSoldOut}
                  onClick={handleBuyNow}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {redirecting ? 'Redirecting…' : 'Buy It Now'}
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={`/messages/new?sellerUid=${activeListing.ownerUid}&listingId=${listingId}`}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message seller
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {Array.isArray(similarListings) && similarListings?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Similar items</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(similarListings ?? []).map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
