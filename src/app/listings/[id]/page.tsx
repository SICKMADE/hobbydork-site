
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast.tsx';

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

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Store as StoreIcon,
  MessageSquare,
  Star,
  Package,
} from 'lucide-react';
import ListingCard from '@/components/ListingCard';

type Listing = {
  id?: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  condition?: string;
  tags?: string[];
  storeId: string;
  ownerUid: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  quantityAvailable?: number;
  state: string;
  createdAt?: any;
};

type Storefront = {
  id?: string;
  storeId: string;
  ownerUid: string;
  storeName: string;
  slug?: string;
  about?: string;
  avatarUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
  status: string;
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [requesting, setRequesting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);
  const [quantity, setQuantity] = useState(1);

  // Listing doc
  const listingRef = useMemoFirebase(() => {
    if (!firestore || !listingId) return null;
    return doc(firestore, 'listings', listingId);
  }, [firestore, listingId]);

  const { data: listing, isLoading: listingLoading } =
    useDoc<Listing>(listingRef);

  // Storefront doc
  const storeRef = useMemoFirebase(() => {
    if (!firestore || !listing?.storeId) return null;
    return doc(firestore, 'storefronts', listing.storeId);
  }, [firestore, listing?.storeId]);

  const { data: store, isLoading: storeLoading } =
    useDoc<Storefront>(storeRef);

  // Similar items (active listings, filtered client-side by category)
  const similarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'listings'),
      where('state', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(24),
    );
  }, [firestore]);
  
  const { data: similarListings } =
  useCollection<Listing>(similarQuery as any);


  const activeListing = listing as any;

  const isOwner =
    !!user && user.uid === activeListing?.ownerUid;

  const quantityAvailable = Number(
    activeListing?.quantityAvailable ?? 0,
  );
  const isSoldOut =
    activeListing?.state === 'SOLD_OUT' ||
    quantityAvailable <= 0;

  const price = Number(activeListing?.price ?? 0);

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

  const categoryLabel =
    activeListing?.category?.replace('_', ' ') ??
    'OTHER';
  const conditionLabel =
    activeListing?.condition?.replace('_', ' ') ??
    'UNKNOWN';

  const storeTitle =
    store?.storeName ?? activeListing?.storeId ?? 'Store';
  const ratingAverage = store?.ratingAverage ?? 0;
  const ratingCount = store?.ratingCount ?? 0;
  const itemsSold = store?.itemsSold ?? 0;

  const similarFiltered =
    (similarListings as any[])?.filter((l) => {
      if (!activeListing) return false;
      const anyL = l as any;
      if (anyL.id === listingId) return false;
      if (anyL.storeId === activeListing.storeId) {
        // We'll show "More from this seller" later if you want;
        // for now filter out the exact listing only.
      }
      return (
        anyL.category === activeListing.category &&
        anyL.state === 'ACTIVE'
      );
    }) ?? [];

  const handleRequestToBuy = async () => {
    if (!firestore) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!activeListing) return;

    if (isOwner) {
      toast({
        title: 'This is your own listing',
        description:
          'You can manage it from My Listings instead.',
        variant: 'destructive',
      });
      return;
    }

    if (isSoldOut) {
      toast({
        title: 'Out of stock',
        description: 'This item is sold out.',
        variant: 'destructive',
      });
      return;
    }

    const qty = Math.max(
      1,
      Math.min(quantityAvailable || 1, quantity || 1),
    );
    const subtotal = price * qty;

    try {

      setRequesting(true);
      await addDoc(collection(firestore, 'orders'), {
        buyerUid: user.uid,
        sellerUid: activeListing.ownerUid,
        storeId: activeListing.storeId,
        items: [
          {
            listingId,
            title: activeListing.title,
            quantity: qty,
            price,
          },
        ],
        subtotal,
        shippingAmount: null,
        feesAmount: 0,
        totalAmount: null,
        paymentMethod: null,
        paymentIdentifier: null,
        state: 'REQUESTED',
        buyerConfirmedPayment: false,
        sellerConfirmedPayment: false,
        trackingNumber: '',
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Purchase request sent',
        description:
          'The seller will send you an invoice with shipping and total.',
      });

      router.push('/orders');
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error sending request',
        description:
          err?.message ??
          'Could not create purchase request.',
        variant: 'destructive',
      });
      setRequesting(false);
    }
  };

  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = e.target.value;
    const num = Number(raw);
    if (Number.isNaN(num)) {
      setQuantity(1);
      return;
    }
    const clamped = Math.max(
      1,
      Math.min(quantityAvailable || 1, num),
    );
    setQuantity(clamped);
  };

  if (listingLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!activeListing) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Listing not found"
          description="This item may have been removed or never existed."
        >
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push('/search')}>
              Back to browse
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8 max-w-6xl mx-auto">
        {/* Top: gallery + details */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_2fr)]">
          {/* Image gallery */}
          <div className="space-y-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full aspect-[4/3] bg-muted flex items-center justify-center">
                  {mainImageUrl ? (
                    <Image
                      src={mainImageUrl}
                      alt={activeListing.title}
                      fill
                      sizes="(min-width: 1024px) 600px, 100vw"
                      className="object-contain"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`relative h-20 w-20 flex-shrink-0 border rounded-md overflow-hidden ${
                      idx === selectedImageIndex
                        ? 'ring-2 ring-primary'
                        : 'border-border'
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <Image
                      src={url}
                      alt={`${activeListing.title} ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details / purchase */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">
                  {categoryLabel}
                </Badge>
                <Badge variant="outline">
                  {conditionLabel}
                </Badge>
                {isSoldOut && (
                  <Badge variant="secondary">
                    Sold out
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {activeListing.title}
              </h1>
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-bold">
                ${price.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {quantityAvailable > 0
                  ? `${quantityAvailable} available`
                  : 'Out of stock'}
              </div>
            </div>

            <Separator />

            {/* Seller / store info */}
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="link"
                    className="h-auto px-0 text-sm"
                    asChild
                  >
                    <Link
                      href={`/store/${activeListing.storeId}`}
                    >
                      {storeTitle}
                    </Link>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    ({itemsSold} item
                    {itemsSold === 1 ? '' : 's'} sold)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    {ratingCount ? (
                      <span>
                        {ratingAverage.toFixed(1)} •{' '}
                        {ratingCount} review
                        {ratingCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span>No reviews yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Purchase box */}
            <Card>
              <CardContent className="py-3 px-4 space-y-3">
                {isOwner ? (
                  <div className="text-xs text-muted-foreground">
                    This is your listing. Manage it from{' '}
                    <Button
                      variant="link"
                      className="h-auto px-1 text-xs"
                      asChild
                    >
                      <Link href="/listings">
                        My Listings
                      </Link>
                    </Button>
                    .
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Qty</span>
                        <input
                          type="number"
                          min={1}
                          max={
                            quantityAvailable > 0
                              ? quantityAvailable
                              : 1
                          }
                          value={quantity}
                          onChange={handleQuantityChange}
                          className="w-20 border rounded-md px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Subtotal</span>
                        <span className="font-semibold">
                          $
                          {(
                            price *
                            Math.max(
                              1,
                              Math.min(
                                quantityAvailable || 1,
                                quantity || 1,
                              ),
                            )
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        className="flex-1"
                        disabled={
                          requesting ||
                          isSoldOut ||
                          quantityAvailable <= 0
                        }
                        onClick={handleRequestToBuy}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {requesting
                          ? 'Sending request...'
                          : 'Request to buy'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <Link
                          href={`/messages/new?sellerUid=${activeListing.ownerUid}&storeId=${activeListing.storeId}&listingId=${listingId}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message seller
                        </Link>
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      You’ll be redirected to your orders
                      page. The seller will send you an
                      invoice with shipping and total. You
                      pay via their preferred method, then
                      mark payment sent.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description / details */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Description
          </h2>
          {activeListing.description ? (
            <p className="text-sm whitespace-pre-line">
              {activeListing.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No description provided.
            </p>
          )}

          {Array.isArray(activeListing.tags) &&
            activeListing.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {activeListing.tags.map(
                  (tag: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[10px]"
                    >
                      #{tag}
                    </Badge>
                  ),
                )}
              </div>
            )}
        </section>

        {/* Similar items */}
        {similarFiltered.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Similar items
              </h2>
              <Button
                variant="link"
                className="h-auto px-0 text-xs"
                asChild
              >
                <Link
                  href={`/search?category=${encodeURIComponent(
                    activeListing.category,
                  )}`}
                >
                  Browse more in{' '}
                  {categoryLabel.toLowerCase()}
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {similarFiltered
                .slice(0, 8)
                .map((similar: any) => (
                  <ListingCard
                    key={similar.id || similar.listingId}
                    listing={similar}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
