'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import type { Listing, Store, Review } from '@/lib/types';
import { Star, MessageSquare, Heart } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

export default function StorefrontPage() {
  const firestore = useFirestore();
  const { loading: authLoading } = useAuth();

  // Get params via hook instead of props
  const params = useParams<{ id: string }>();
  const storeId = params.id;

  console.log('[Storefront] storeId from useParams =', storeId);

  // 1) Store doc
  const storeRef = useMemoFirebase(() => {
    if (authLoading || !firestore || !storeId) return null;
    return doc(firestore, 'storefronts', storeId);
  }, [firestore, storeId, authLoading]);

  const { data: store, isLoading: isStoreLoading } = useDoc<Store>(storeRef);

  // 2) Listings
  const listingsQuery = useMemoFirebase(() => {
    if (authLoading || !firestore || !storeId) return null;
    return query(
      collection(firestore, 'listings'),
      where('storeId', '==', storeId),
      where('state', '==', 'ACTIVE')
    );
  }, [firestore, storeId, authLoading]);

  const { data: listings, isLoading: areListingsLoading } =
    useCollection<Listing>(listingsQuery);

  // 3) Reviews
  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(firestore, `storefronts/${storeId}/reviews`),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, storeId]);

  const { data: reviews, isLoading: areReviewsLoading } =
    useCollection<Review>(reviewsQuery);

  console.log('[Storefront] store =', store);
  console.log('[Storefront] listings =', listings);
  console.log('[Storefront] reviews =', reviews);

  if (authLoading || isStoreLoading || areListingsLoading || areReviewsLoading) {
    return (
      <AppLayout>
        <div>Loading storefront...</div>
      </AppLayout>
    );
  }

  if (!store) {
    // Now this is a real “no doc” case, not a params issue
    return (
      <AppLayout>
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Store not found</h1>
          <p>
            Store ID: <code>{storeId}</code>
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="overflow-hidden">
          <div className="h-48 bg-muted-foreground/20 relative flex items-center justify-center" />
          <CardContent className="p-6 relative">
            <div className="absolute -top-16 left-6">
              <Image
                src={
                  store.avatarUrl ||
                  `https://picsum.photos/seed/${store.slug ?? storeId}/128/128`
                }
                alt={`${store.storeName} logo`}
                width={128}
                height={128}
                className="rounded-full border-4 border-background"
                data-ai-hint="store logo"
              />
            </div>
            <div className="pt-16 flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {store.storeName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">
                      {store.ratingAverage?.toFixed
                        ? store.ratingAverage.toFixed(1)
                        : '0.0'}
                    </span>
                    <span>({store.ratingCount ?? 0} reviews)</span>
                  </div>
                  <span>&middot;</span>
                  <span>{store.itemsSold ?? 0} items sold</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <MessageSquare className="mr-2" /> Message
                </Button>
                <Button variant="outline">
                  <Heart className="mr-2" /> Favorite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">About This Store</h2>
                <p className="text-foreground/80">{store.about}</p>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Store Items
              </h2>
              {listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  This store has no active listings.
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Store Reviews
            </h2>
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.reviewId}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage
                          src={review.buyerAvatar}
                          alt={review.buyerName}
                        />
                        <AvatarFallback>
                          {review.buyerName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{review.buyerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                review.createdAt.toDate(),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-sm text-foreground/80 mt-2">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground">
                This store has no reviews yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
