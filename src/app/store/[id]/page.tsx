'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Listing, Store, Review } from '@/lib/types';
import { Star, MessageSquare, Heart } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);

export default function StorefrontPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'storefronts', params.id);
  }, [firestore, params.id]);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(
      collection(firestore, 'listings'),
      where('storeId', '==', params.id),
      where('state', '==', 'ACTIVE')
    );
  }, [firestore, params.id]);

  const reviewsQuery = useMemoFirebase(() => {
      if (!firestore || !params.id) return null;
      return query(collection(firestore, `storefronts/${params.id}/reviews`), orderBy('createdAt', 'desc'));
  }, [firestore, params.id]);

  const { data: store, isLoading: isStoreLoading } = useDoc<Store>(storeRef);
  const { data: listings, isLoading: areListingsLoading } = useCollection<Listing>(listingsQuery);
  const { data: reviews, isLoading: areReviewsLoading } = useCollection<Review>(reviewsQuery);


  if (isStoreLoading || areListingsLoading || areReviewsLoading) {
    return <AppLayout><div>Loading storefront...</div></AppLayout>;
  }

  if (!store) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="overflow-hidden">
          <div className="h-48 bg-muted-foreground/20 relative flex items-center justify-center">
            {/* Placeholder for a banner image */}
          </div>
          <CardContent className="p-6 relative">
            <div className="absolute -top-16 left-6">
              <Image
                src={store.avatarUrl || `https://picsum.photos/seed/${store.slug}/128/128`}
                alt={`${store.storeName} logo`}
                width={128}
                height={128}
                className="rounded-full border-4 border-background"
                data-ai-hint="store logo"
              />
            </div>
            <div className="pt-16 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{store.storeName}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{store.ratingAverage.toFixed(1)}</span>
                        <span>({store.ratingCount} reviews)</span>
                        </div>
                        <span>&middot;</span>
                        <span>{store.itemsSold} items sold</span>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline"><MessageSquare className="mr-2" /> Message</Button>
                    <Button variant="outline"><Heart className="mr-2" /> Favorite</Button>
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
                    <h2 className="text-2xl font-semibold tracking-tight mb-4">Store Items</h2>
                    {listings && listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">This store has no active listings.</p>
                    )}
                </div>
            </div>
             <div className="md:col-span-1 space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Store Reviews</h2>
                {reviews && reviews.length > 0 ? (
                    reviews.map(review => (
                        <Card key={review.reviewId}>
                           <CardContent className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={review.buyerAvatar} alt={review.buyerName} />
                                        <AvatarFallback>{review.buyerName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{review.buyerName}</p>
                                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true })}</p>
                                            </div>
                                            <StarRating rating={review.rating} />
                                        </div>
                                         <p className="text-sm text-foreground/80 mt-2">{review.comment}</p>
                                    </div>
                                </div>
                           </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-muted-foreground">This store has no reviews yet.</p>
                )}
             </div>
        </div>
      </div>
    </AppLayout>
  );
}
