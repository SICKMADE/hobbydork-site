'use client';

import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';

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

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [redirecting, setRedirecting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /* ---------- LISTING ---------- */

  const listingRef = useMemoFirebase(() => {
    if (!firestore || !listingId) return null;
    return doc(firestore, 'listings', listingId);
  }, [firestore, listingId]);

  const { data: listing, isLoading } = useDoc<Listing>(listingRef);
  const activeListing = listing as any;

  /* ---------- STORE ---------- */

  const storeRef = useMemoFirebase(() => {
    if (!firestore || !activeListing?.storeId) return null;
    return doc(firestore, 'storefronts', activeListing.storeId);
  }, [firestore, activeListing?.storeId]);

  const { data: store } = useDoc<Storefront>(storeRef);

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

  const similarQuery = useMemoFirebase(() => {
    if (!firestore || !activeListing?.category) return null;
    return query(
      collection(firestore, 'listings'),
      where('state', '==', 'ACTIVE'),
      where('category', '==', activeListing.category),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
  }, [firestore, activeListing?.category]);

  const { data: similarListings } =
    useCollection<Listing>(similarQuery as any);

  /* ---------- BUY NOW (STRIPE) ---------- */

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!firestore || !activeListing || isOwner || isSoldOut) return;

    try {
      setRedirecting(true);

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

      const functions = getFunctions(getApp(), 'us-central1');
      const createCheckoutSession = httpsCallable(
        functions,
        'createCheckoutSession'
      );

      const res: any = await createCheckoutSession({
        orderId: orderRef.id,
        amountCents: Math.round(price * quantity * 100),
        listingTitle: activeListing.title,
      });

      window.location.href = res.data.url;
    } catch (err: any) {
      console.error(err);
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
                  <button
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
                  </button>
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

        {Array.isArray(similarListings) && similarListings.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Similar items</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarListings.map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
