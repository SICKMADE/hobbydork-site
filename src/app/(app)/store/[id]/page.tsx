
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
  Link2,
  Flag,
  Upload,
  Eye,
} from 'lucide-react';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { ReportUserDialog } from '@/components/moderation/ReportUserDialog';
import ListingCard from '@/components/ListingCard';

type StoreDoc = {
  ownerUid: string;
  storeName: string;
  slug?: string;
  about?: string;
  avatarUrl?: string;
  storeImageUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type ListingDoc = {
  id?: string;
  listingId: string;
  storeId: string;
  ownerUid: string;
  title: string;
  primaryImageUrl?: string;
  price: number;
  quantityAvailable: number;
  state: 'ACTIVE' | 'DRAFT' | 'SOLD' | 'HIDDEN';
  category?: string;
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
  const [storeImageOverride, setStoreImageOverride] = useState<string | null>(null);
  const [viewAsBuyer, setViewAsBuyer] = useState(false);

  // Store doc
  const storeRef = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return doc(firestore, 'storefronts', storeId);
  }, [firestore, storeId]);

  const { data: store, isLoading: storeLoading } = useDoc<StoreDoc>(storeRef as any);

  // Owner profile doc
  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !store?.ownerUid) return null;
    return doc(firestore, 'users', store.ownerUid);
  }, [firestore, store?.ownerUid]);

  const { data: ownerProfile } = useDoc<OwnerProfile>(ownerRef as any);

  // Listings
  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(firestore, 'listings'),
      where('storeId', '==', storeId),
      where('state', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, storeId]);

  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery as any);

  // Reviews
  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(
      collection(firestore, 'storefronts', storeId, 'reviews'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, storeId]);

  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery as any);

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

  // Poster image
  const poster =
    storeImageOverride ||
    store.storeImageUrl ||
    store.avatarUrl ||
    'https://via.placeholder.com/1200x400?text=Storefront';

  // Owner avatar
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
    if (!shareUrl || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  };

  const handleStoreImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore || !storeId) return;

    try {
      setUploadingImage(true);

      const storage = getStorage();
      const imageRef = ref(storage, `storefronts/${storeId}/poster-${Date.now()}`);

      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);

      const sfRef = doc(firestore, 'storefronts', storeId);
      await updateDoc(sfRef, {
        storeImageUrl: url,
        updatedAt: serverTimestamp(),
      });

      setStoreImageOverride(url);

      toast({
        title: 'Poster updated',
        description: 'Your storefront poster has been replaced.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Upload error',
        description: err?.message ?? 'Failed to update poster.',
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  return (
<AppLayout>
  <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">

    {/* -------------------- POSTER WITH TAPE -------------------- */}
    <Card className="comic-panel !p-0 overflow-visible relative bg-muted/30">
        <div className="tape-corner top-left"></div>
        <div className="tape-corner top-right"></div>
        <div className="tape-corner bottom-left"></div>
        <div className="tape-corner bottom-right"></div>
        <div className="relative w-full aspect-[2.5/1]">
          <Image
            src={poster}
            alt="Store Poster"
            fill
            className="object-contain p-4"
          />
        </div>
    </Card>
    
    {/* OWNER CONTROLS */}
    {showOwnerControls && (
      <div className="flex flex-wrap items-center justify-center gap-2 -mt-2">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted comic-button">
          <Upload className="h-3 w-3" />
          {uploadingImage ? "Uploading…" : "Change poster"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleStoreImageChange}
            disabled={uploadingImage}
          />
        </label>

        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs comic-button"
          onClick={() => setViewAsBuyer((v) => !v)}
        >
          <Eye className="h-3 w-3" />
          {viewAsBuyer ? "Back to owner view" : "View as buyer"}
        </Button>
      </div>
    )}

    {/* -------------------- STORE INFO -------------------- */}
    <Card className="comic-panel">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start">

        <Avatar className="h-16 w-16 border-4 border-black comic-avatar-shadow">
          <AvatarImage src={ownerAvatar} />
          <AvatarFallback>{store.storeName?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <CardTitle className="text-xl font-bold comic-title">
            {store.storeName}
          </CardTitle>

          {store.about && (
            <CardDescription className="text-sm">
              {store.about}
            </CardDescription>
          )}

          {/* Ratings */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ratingCount > 0 ? (
              <div className="flex items-center gap-1">
                {renderStars(ratingAverage, 16)}
                <span className="text-xs">
                  {ratingAverage?.toFixed(1)} • {ratingCount} review{ratingCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <span className="text-xs">No reviews yet</span>
            )}

            {itemsSold > 0 && (
              <Badge variant="outline" className="text-xs border-black">
                {itemsSold} item{itemsSold === 1 ? "" : "s"} sold
              </Badge>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col justify-end items-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 comic-button"
            onClick={() => handleCopyLink()}
          >
            <Link2 className="h-4 w-4" />
            Copy link
          </Button>

          {!isOwner && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1 comic-button"
            >
              <Link href={`/messages/new?recipientUid=${store.ownerUid}`}>
                <MessageCircle className="h-4 w-4" />
                Message seller
              </Link>
            </Button>
          )}

          {!isOwner && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-red-500 hover:text-red-500 comic-button"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="h-4 w-4" />
              Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* -------------------- LISTINGS -------------------- */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold comic-title">Active listings</h2>
      </div>

      {listingsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing: any) => (
            <ListingCard key={listing.id || listing.listingId} listing={listing} />
          ))}
        </div>
      ) : (
        <Card className="comic-panel">
          <CardContent className="py-6 text-sm">
            No active listings.
          </CardContent>
        </Card>
      )}
    </div>

    {/* -------------------- REVIEWS -------------------- */}
    <div className="space-y-3 pb-10">
      <h2 className="text-lg font-bold comic-title">Reviews</h2>

      {reviewsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review: any) => {
            const createdText = review.createdAt
              ? formatDistanceToNow(
                  review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt,
                  { addSuffix: true }
                )
              : null;

            return (
              <Card key={review.id} className="comic-panel">
                <CardContent className="flex gap-3 py-3 text-sm">
                  <div className="mt-1">{renderStars(review.rating, 14)}</div>
                  <div className="flex-1 space-y-1">
                    {review.comment && <p className="text-sm">{review.comment}</p>}
                    {createdText && (
                      <p className="text-xs">Left {createdText}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="comic-panel">
          <CardContent className="py-6 text-sm">
            No reviews yet.
          </CardContent>
        </Card>
      )}
    </div>

    {/* REPORT DIALOG */}
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

  </div>
</AppLayout>
  );
}
