'use client';

import { useState, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  orderBy,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import {
  Card,
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
  Link2,
  Flag,
  Upload,
  Eye,
} from 'lucide-react';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { ReportUserDialog } from '@/components/moderation/ReportUserDialog';

type StoreDoc = {
  id?: string;
  ownerUid: string;
  storeName: string;
  slug?: string;
  about?: string;
  avatarUrl?: string;       // legacy store avatar/logo
  storeImageUrl?: string;   // big storefront image
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
  state: 'ACTIVE' | 'DRAFT' | 'SOLD' | 'HIDDEN';
  category?:
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
  rating: number;
  comment?: string;
  buyerUid: string;
  createdAt?: any;
};

type OwnerProfile = {
  avatar?: string;
  avatarUrl?: string;
  photoURL?: string;
  profileImageUrl?: string;
  displayName?: string;
};

const CATEGORY_LABELS: Record<
  NonNullable<ListingDoc['category']>,
  string
> = {
  COMIC_BOOKS: 'Comic books',
  SPORTS_CARDS: 'Sports cards',
  POKEMON_CARDS: 'Pokémon cards',
  VIDEO_GAMES: 'Video games',
  TOYS: 'Toys',
  OTHER: 'Other',
};

function renderStars(avg: number | null | undefined, size = 14) {
  const value = avg ?? 0;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const max = 5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isFull = index <= full;
        const isHalf = !isFull && half && index === full + 1;

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
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted-foreground))'
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
  const { toast } = useToast();

  const [reportOpen, setReportOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [storeImageOverride, setStoreImageOverride] = useState<string | null>(
    null,
  );
  const [viewAsBuyer, setViewAsBuyer] = useState(false);

  // Store doc
  const storeRef = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return doc(firestore, 'storefronts', storeId);
  }, [firestore, storeId]);

  const {
    data: store,
    isLoading: storeLoading,
  } = useDoc<StoreDoc>(storeRef as any);

  // Owner profile doc (this is where the real avatar lives)
  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !store?.ownerUid) return null;
    return doc(firestore, 'users', store.ownerUid);
  }, [firestore, store?.ownerUid]);

  const { data: ownerProfile } = useDoc<OwnerProfile>(ownerRef as any);

  // Listings for the store
  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(firestore, 'listings'),
      where('storeId', '==', storeId),
      where('state', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, storeId]);

  const {
    data: listings,
    isLoading: listingsLoading,
  } = useCollection<ListingDoc>(listingsQuery as any);

  // Reviews
  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(firestore, 'storefronts', storeId, 'reviews'),
      orderBy('createdAt', 'desc'),
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
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!store || (store as any).status !== 'ACTIVE') {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Store not found"
          description="This store does not exist or is not available."
        />
      </AppLayout>
    );
  }

  const ratingAverage = store.ratingAverage ?? null;
  const ratingCount = store.ratingCount ?? 0;
  const itemsSold = store.itemsSold ?? 0;

  // Big storefront image
  const storeImage =
    storeImageOverride ||
    store.storeImageUrl ||
    store.avatarUrl ||
    'https://via.placeholder.com/900x600?text=Storefront';

  // THIS is the profile picture: prefer user.avatar, then fallbacks
  const ownerAvatar =
    ownerProfile?.avatar ||
    ownerProfile?.avatarUrl ||
    ownerProfile?.photoURL ||
    ownerProfile?.profileImageUrl ||
    store.avatarUrl ||
    '';

  const isOwner = user?.uid === store.ownerUid;

  const showOwnerControls = isOwner && !viewAsBuyer;
  const showBuyerControls = !isOwner || viewAsBuyer;

  const shareUrl =
    typeof window !== 'undefined' && storeId
      ? `${window.location.origin}/store/${storeId}`
      : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
  };

  const handleStoreImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !firestore || !storeId) return;

    try {
      setUploadingImage(true);

      const storage = getStorage();
      const imageRef = ref(
        storage,
        `storefronts/${storeId}/store-image-${Date.now()}`,
      );

      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);

      const sfRef = doc(firestore, 'storefronts', storeId);
      await updateDoc(sfRef, {
        storeImageUrl: url,
        updatedAt: serverTimestamp(),
      });

      setStoreImageOverride(url);

      toast({
        title: 'Store image updated',
        description: 'Your storefront image has been saved.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error uploading image',
        description: err?.message ?? 'Could not update store image.',
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        {/* Storefront card + header */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:gap-6">
            {/* BIG STOREFRONT IMAGE */}
            <div className="w-full md:w-3/5">
              <div className="relative mx-auto h-56 w-full overflow-hidden rounded-xl border bg-muted sm:h-64">
                <Image
                  src={storeImage}
                  alt={`${store.storeName} storefront`}
                  fill
                  className="object-contain"
                />
              </div>

              {showOwnerControls && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-muted">
                    <Upload className="h-3 w-3" />
                    <span>
                      {uploadingImage
                        ? 'Uploading...'
                        : 'Change storefront image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleStoreImageChange}
                      disabled={uploadingImage}
                    />
                  </label>

                  {/* View-as-buyer toggle */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-[11px]"
                    onClick={() => setViewAsBuyer((v) => !v)}
                  >
                    <Eye className="h-3 w-3" />
                    {viewAsBuyer ? 'Back to owner view' : 'View as buyer'}
                  </Button>
                </div>
              )}
            </div>

            {/* Store details / owner info / actions */}
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 md:h-16 md:w-16">
                  <AvatarImage src={ownerAvatar} />
                  <AvatarFallback>
                    {store.storeName?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <CardTitle className="text-lg md:text-xl">
                    {store.storeName}
                  </CardTitle>
                  {store.slug && (
                    <p className="text-[11px] text-muted-foreground">
                      hobbydork.app/store/{store.slug}
                    </p>
                  )}
                  {store.about && (
                    <CardDescription className="text-xs md:text-sm">
                      {store.about}
                    </CardDescription>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {ratingCount > 0 ? (
                      <div className="flex items-center gap-1">
                        {renderStars(ratingAverage, 14)}
                        <span className="text-[11px] text-muted-foreground">
                          {ratingAverage?.toFixed(1)} • {ratingCount} review
                          {ratingCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        No reviews yet
                      </span>
                    )}
                    {itemsSold > 0 && (
                      <Badge variant="outline" className="text-[11px]">
                        {itemsSold} item{itemsSold === 1 ? '' : 's'} sold
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
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

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                >
                  <Link2 className="h-4 w-4" />
                  Copy store link
                </Button>

                {showBuyerControls && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 text-red-500 hover:text-red-500"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="h-4 w-4" />
                    Report seller
                  </Button>
                )}

                {showOwnerControls && (
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                  >
                    <Link href="/profile">
                      Edit profile / store info
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">
                Active listings
              </h2>
            </div>
            {showOwnerControls && (
              <Button asChild size="sm" variant="outline">
                <Link href="/listings/create">Create listing</Link>
              </Button>
            )}
          </div>

          {listingsLoading && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!listingsLoading && (!listings || listings.length === 0) && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No active listings yet.
              </CardContent>
            </Card>
          )}

          {!listingsLoading && listings && listings.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {listings.map((listing) => {
                const createdText = listing.createdAt
                  ? formatDistanceToNow(
                      listing.createdAt.toDate
                        ? listing.createdAt.toDate()
                        : listing.createdAt,
                      { addSuffix: true },
                    )
                  : null;

                const categoryLabel = listing.category
                  ? CATEGORY_LABELS[listing.category]
                  : undefined;

                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                  >
                    <Card className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                      {listing.primaryImageUrl && (
                        <div className="relative aspect-square w-full bg-muted">
                          <Image
                            src={listing.primaryImageUrl}
                            alt={listing.title}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <CardContent className="space-y-1 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {listing.title}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-bold">
                              ${listing.price.toFixed(2)}
                            </span>
                            {categoryLabel && (
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                {categoryLabel}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                          <span>
                            {listing.quantityAvailable} in stock
                          </span>
                          {createdText && (
                            <span>Listed {createdText}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Reviews
            </h2>
          </div>

          {reviewsLoading && (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {!reviewsLoading && (!reviews || reviews.length === 0) && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No reviews yet.
              </CardContent>
            </Card>
          )}

          {!reviewsLoading && reviews && reviews.length > 0 && (
            <div className="space-y-2">
              {reviews.map((review) => {
                const createdText = review.createdAt
                  ? formatDistanceToNow(
                      review.createdAt.toDate
                        ? review.createdAt.toDate()
                        : review.createdAt,
                      { addSuffix: true },
                    )
                  : null;

                return (
                  <Card key={review.id}>
                    <CardContent className="flex gap-3 py-3 text-sm">
                      <div className="mt-1">
                        {renderStars(review.rating, 12)}
                      </div>
                      <div className="flex-1 space-y-1">
                        {review.comment && (
                          <p className="text-sm">{review.comment}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {createdText && `Left ${createdText}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showBuyerControls && (
        <ReportUserDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetUid={store.ownerUid}
          targetDisplayName={store.storeName}
          context={{
            source: 'STORE',
            storeId: storeId || null,
          }}
        />
      )}
    </AppLayout>
  );
}
