'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';

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
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

import {
  Star,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';

type StoreDoc = {
  id?: string;
  ownerUid: string;
  storeName: string;
  slug?: string;
  about?: string;
  avatarUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type ListingDoc = {
  id?: string;
  storeId: string;
  ownerUid: string;
  title: string;
  primaryImageUrl?: string;
  price: number;
  quantityAvailable: number;
  state: string;
  category:
    | 'COMIC_BOOKS'
    | 'SPORTS_CARDS'
    | 'POKEMON_CARDS'
    | 'VIDEO_GAMES'
    | 'TOYS'
    | 'OTHER';
  createdAt?: any;
};

type ReviewDoc = {
  id?: string;
  orderId: string;
  storeId: string;
  sellerUid: string;
  reviewerUid: string;
  rating: number;
  comment?: string;
  createdAt?: any;
};

const CATEGORY_LABELS: Record<ListingDoc['category'], string> = {
  COMIC_BOOKS: 'Comic books',
  SPORTS_CARDS: 'Sports cards',
  POKEMON_CARDS: 'Pokémon cards',
  VIDEO_GAMES: 'Video games',
  TOYS: 'Toys',
  OTHER: 'Other',
};

function renderStars(avg: number | null, size = 14) {
  const value = avg ?? 0;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const max = 5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isFull = index <= full;
        const isHalf =
          !isFull && half && index === full + 1;

        return (
          <Star
            key={i}
            className="inline-block"
            style={{
              width: size,
              height: size,
              fill: isFull || isHalf ? 'currentColor' : 'none',
            }}
            strokeWidth={1.5}
            color={
              isFull || isHalf
                ? '#facc15'
                : 'rgba(148,163,184,0.8)'
            }
          />
        );
      })}
    </div>
  );
}

export default function StorePage() {
  const params = useParams<{ id: string }>();
  const storeId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return doc(firestore, 'storefronts', storeId);
  }, [firestore, storeId]);

  const { data: store, isLoading: storeLoading } =
    useDoc<StoreDoc>(storeRef as any);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(firestore, 'listings'),
      where('storeId', '==', storeId),
      where('state', '==', 'ACTIVE'),
    );
  }, [firestore, storeId]);

  const {
    data: listings,
    isLoading: listingsLoading,
  } = useCollection<ListingDoc>(listingsQuery as any);

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(
        firestore,
        'storefronts',
        storeId,
        'reviews',
      ),
    );
  }, [firestore, storeId]);

  const {
    data: reviews,
    isLoading: reviewsLoading,
  } = useCollection<ReviewDoc>(reviewsQuery as any);

  if (authLoading || storeLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!store) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Store not found"
          description="This store does not exist or is not available."
        >
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  const listingItems = (listings || []).map((snap: any) => {
    const l = snap as ListingDoc & { id: string };
    const created =
      l.createdAt?.toDate?.() ?? null;
    const createdText =
      created &&
      formatDistanceToNow(created, { addSuffix: true });
    return {
      ...l,
      id: l.id,
      created,
      createdText,
    };
  });

  const reviewItems = (reviews || []).map((snap: any) => {
    const r = snap as ReviewDoc & { id: string };
    const created =
      r.createdAt?.toDate?.() ?? null;
    const createdText =
      created &&
      formatDistanceToNow(created, { addSuffix: true });
    return {
      ...r,
      id: r.id,
      created,
      createdText,
    };
  });

  const ratingValues = reviewItems
    .map((r) => r.rating || 0)
    .filter((n) => n > 0);
  const ratingCount = ratingValues.length;
  const ratingAverage =
    ratingCount > 0
      ? ratingValues.reduce((a, b) => a + b, 0) /
        ratingCount
      : null;

  const itemsSold = store.itemsSold ?? 0;

  const isOwner = user?.uid === store.ownerUid;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        {/* Store header */}
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="h-14 w-14 md:h-16 md:w-16">
                <AvatarImage src={store.avatarUrl} />
                <AvatarFallback>
                  {store.storeName
                    ?.charAt(0)
                    .toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-lg md:text-xl">
                  {store.storeName}
                </CardTitle>
                {store.about && (
                  <CardDescription className="text-xs md:text-sm">
                    {store.about}
                  </CardDescription>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {ratingCount > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        {renderStars(ratingAverage, 14)}
                        <span className="text-[11px] text-muted-foreground">
                          {ratingAverage?.toFixed(1)} •{' '}
                          {ratingCount}{' '}
                          review
                          {ratingCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      No reviews yet
                    </span>
                  )}
                  {itemsSold > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[11px]"
                    >
                      {itemsSold} item
                      {itemsSold === 1 ? '' : 's'} sold
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Link
                    href={`/messages/new?recipientUid=${store.ownerUid}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message seller
                  </Link>
                </Button>
              </div>
              {isOwner && (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-[11px] px-2 h-7"
                >
                  <Link href="/profile">
                    Edit profile / store info
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Listings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">
                Active listings
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {listingItems.length} listing
              {listingItems.length === 1 ? '' : 's'}
            </span>
          </div>

          {listingsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-24 w-full"
                />
              ))}
            </div>
          )}

          {!listingsLoading &&
            listingItems.length === 0 && (
              <Card>
                <CardContent className="py-4 text-xs text-muted-foreground">
                  No active listings yet.
                </CardContent>
              </Card>
            )}

          {!listingsLoading &&
            listingItems.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {listingItems.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                  >
                    <Card className="h-full hover:bg-muted/60 transition-colors">
                      <CardContent className="flex gap-3 py-3">
                        {listing.primaryImageUrl && (
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={listing.primaryImageUrl}
                              alt={listing.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold line-clamp-2">
                              {listing.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">
                                ${listing.price.toFixed(2)}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                {
                                  CATEGORY_LABELS[
                                    listing.category
                                  ]
                                }
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                            <span>
                              {listing.quantityAvailable} in
                              stock
                            </span>
                            {listing.createdText && (
                              <span>
                                Listed {listing.createdText}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-semibold">
              Recent reviews
            </h2>
          </div>

          {reviewsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full"
                />
              ))}
            </div>
          )}

          {!reviewsLoading &&
            reviewItems.length === 0 && (
              <Card>
                <CardContent className="py-4 text-xs text-muted-foreground">
                  No reviews yet. Completed orders will show up
                  here once buyers leave feedback.
                </CardContent>
              </Card>
            )}

          {!reviewsLoading &&
            reviewItems.length > 0 && (
              <div className="space-y-2">
                {reviewItems
                  .sort(
                    (a, b) =>
                      (b.created?.getTime?.() || 0) -
                      (a.created?.getTime?.() || 0),
                  )
                  .slice(0, 10)
                  .map((review) => (
                    <Card key={review.id}>
                      <CardContent className="flex items-start gap-3 py-3">
                        <div className="mt-0.5">
                          {renderStars(
                            review.rating,
                            12,
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            {review.comment ||
                              'No comment provided.'}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            From order #
                            {review.orderId.slice(0, 8)}
                            {review.createdText &&
                              ` • ${review.createdText}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
