"use client";

import * as React from "react";
// Store image upload state and logic (moved from dashboard)
// ...existing code...

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import AppLayout from "@/components/layout/AppLayout";
import PlaceholderContent from "@/components/PlaceholderContent";
import { useAuth } from "@/hooks/use-auth";
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { useToast } from "@/hooks/use-toast";

import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, getDocs, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { storage } from "@/firebase/client-provider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import { Star, StarHalf, MessageCircle, ShoppingBag } from "lucide-react";

type StoreDoc = {
  id?: string;
  ownerUid: string;
  storeName: string;
  slug?: string;
  about?: string;
  avatarUrl?: string;
  storeImageUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
  status?: "ACTIVE" | "INACTIVE";
};

type ListingDoc = {
  id?: string;
  storeId: string;
  ownerUid: string;
  title: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  price: number;
  quantityAvailable: number;
  state: string;
  category:
    | "COMIC_BOOKS"
    | "SPORTS_CARDS"
    | "POKEMON_CARDS"
    | "VIDEO_GAMES"
    | "TOYS"
    | "OTHER";
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

const CATEGORY_LABELS: Record<ListingDoc["category"], string> = {
  COMIC_BOOKS: "Comic books",
  SPORTS_CARDS: "Sports cards",
  POKEMON_CARDS: "Pokémon cards",
  VIDEO_GAMES: "Video games",
  TOYS: "Toys",
  OTHER: "Other",
};

function RenderStars({ avg, size = 14 }: { avg: number | null; size?: number }) {
  const value = Math.max(0, Math.min(5, avg ?? 0));
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const max = 5;

  return (
    <div className="flex items-center gap-0.5" aria-label={avg ? `${avg.toFixed(1)} out of 5 stars` : "No rating"}>
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isFull = index <= full;
        const isHalf = !isFull && half && index === full + 1;

        if (isFull) {
          return (
            <Star
              key={i}
              className="text-yellow-500"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
              fill="currentColor"
            />
          );
        }

        if (isHalf) {
          return (
            <StarHalf
              key={i}
              className="text-yellow-500"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
              fill="currentColor"
            />
          );
        }

        return (
          <Star
            key={i}
            className="text-muted-foreground"
            style={{ width: size, height: size }}
            strokeWidth={1.5}
            fill="none"
          />
        );
      })}
    </div>
  );
}


export default function StorePage() {
  // --- HOOKS: Always call hooks at the top, before any conditional returns ---
  const [ownerName, setOwnerName] = React.useState<string>("");


  // (Removed duplicate variable declarations)


  // Fallback: use owner's displayName if storeName is missing (must be after 'store' is declared)

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storeIdParam = params?.id;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useAuth();
  // Allow reading Firestore if user is loaded (auth checked), or if user is present (authed), or if user is null (guest)
  const canReadFirestore = !authLoading;

  // Some parts of the app historically linked to /store/{uid}. If that happens,
  // resolve the seller's storefront doc by ownerUid and use the real storeId.
  const [effectiveStoreId, setEffectiveStoreId] = React.useState<string | undefined>(storeIdParam);

  React.useEffect(() => {
    setEffectiveStoreId(storeIdParam);
  }, [storeIdParam]);

  const storeRef = useMemoFirebase(() => {
    if (!firestore || !effectiveStoreId) return null;
    return doc(firestore, "stores", effectiveStoreId);
  }, [firestore, effectiveStoreId]);

  const { data: store, isLoading: storeLoading } = useDoc<StoreDoc>(storeRef as any);

  const [newStoreImageFile, setNewStoreImageFile] = React.useState<File | null>(null);
  const [newStoreImagePreviewUrl, setNewStoreImagePreviewUrl] = React.useState<string | null>(null);
  const [uploadingStoreImage, setUploadingStoreImage] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (newStoreImagePreviewUrl) URL.revokeObjectURL(newStoreImagePreviewUrl);
    };
  }, [newStoreImagePreviewUrl]);

  React.useEffect(() => {
    if (!canReadFirestore || !firestore) return;
    if (!storeIdParam) return;
    if (storeLoading) return;
    if (store) return;

    // Attempt uid -> storeId lookup.
    (async () => {
      try {
        const q = query(
          collection(firestore, "stores"),
          where("ownerUid", "==", storeIdParam),
          limit(1),
        );
        const snap = canReadFirestore ? await getDocs(q) : { empty: true, docs: [] };
        if (snap.empty) return;

        const resolvedId = snap.docs[0].id;
        if (resolvedId && resolvedId !== effectiveStoreId) {
          setEffectiveStoreId(resolvedId);
          router.replace(`/store/${resolvedId}`);
        }
      } catch {
        // If rules block this lookup, just fall back to the normal not-found UI.
      }
    })();
  }, [canReadFirestore, firestore, storeIdParam, storeLoading, store, effectiveStoreId, router]);

  const listingsQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !effectiveStoreId) return null;
    return query(
      collection(firestore, "listings"),
      where("storeId", "==", effectiveStoreId),
      where("state", "==", "ACTIVE")
    );
  }, [canReadFirestore, firestore, effectiveStoreId]);

  const { data: listings, isLoading: listingsLoading } = useCollection<ListingDoc>(canReadFirestore ? listingsQuery as any : null);

  const reviewsQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !effectiveStoreId) return null;
    return query(collection(firestore, "stores", effectiveStoreId, "reviews"));
  }, [canReadFirestore, firestore, effectiveStoreId]);

  const { data: reviews, isLoading: reviewsLoading } = useCollection<ReviewDoc>(canReadFirestore ? reviewsQuery as any : null);

  const storeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/\/+$/g, "")}/store/${effectiveStoreId || storeIdParam}`
      : `https://www.hobbydork.com/store/${effectiveStoreId || storeIdParam}`;

  const copyStoreUrl = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(storeUrl);
      } else {
        const el = document.createElement("textarea");
        el.value = storeUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      toast({ title: "Copied store URL" });
    } catch {
      toast({
        title: "Copy failed",
        description: getFriendlyErrorMessage(null) || "Could not copy store URL.",
        variant: "destructive",
      });
    }
  };

  const onPickStoreImage = (file: File | null) => {
    setNewStoreImageFile(file);

    if (newStoreImagePreviewUrl) {
      URL.revokeObjectURL(newStoreImagePreviewUrl);
      setNewStoreImagePreviewUrl(null);
    }

    if (file) {
      setNewStoreImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadStoreImage = async () => {
    if (!user) return;
    if (!storeRef) return;
    if (!effectiveStoreId) return;
    if (!newStoreImageFile) return;
    if (!storage) {
      toast({
        title: "Uploads unavailable",
        description: getFriendlyErrorMessage(null) || "Storage is not ready yet. Refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setUploadingStoreImage(true);
    try {
      const safeName = newStoreImageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `storeImages/${user.uid}/${effectiveStoreId}/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, newStoreImageFile);
      const url = await getDownloadURL(storageRef);
      await updateDoc(storeRef as any, { storeImageUrl: url, updatedAt: serverTimestamp() });
      toast({ title: "Store image updated" });
      onPickStoreImage(null);
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: getFriendlyErrorMessage(e) || "Failed to upload store image.",
        variant: "destructive",
      });
    } finally {
      setUploadingStoreImage(false);
    }
  };

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
    const created = l.createdAt?.toDate?.() ?? null;
    const createdText = created && formatDistanceToNow(created, { addSuffix: true });
    return { ...l, id: l.id, created, createdText };
  });

  const reviewItems = (reviews || []).map((snap: any) => {
    const r = snap as ReviewDoc & { id: string };
    const created = r.createdAt?.toDate?.() ?? null;
    const createdText = created && formatDistanceToNow(created, { addSuffix: true });
    return { ...r, id: r.id, created, createdText };
  });

  const ratingValues = reviewItems.map((r) => r.rating || 0).filter((n) => n > 0);
  const ratingCount = ratingValues.length;
  const ratingAverage = ratingCount > 0 ? ratingValues.reduce((a, b) => a + b, 0) / ratingCount : null;
  const itemsSold = store.itemsSold ?? 0;
  const isOwner = user?.uid === store.ownerUid;

  // DEBUG: Log store object and storeName
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    // ...existing code...
  }
  // (No duplicate variable declarations below)
  const storeName = store?.storeName || ownerName || "Store";
  const avatarUrl = store.avatarUrl || "/hobbydork-head.png";
  const coverUrl = store.storeImageUrl || "/store.png";
  const about = store.about;
  const storeIdForLinks = effectiveStoreId || storeIdParam || "";

  const RedLineSeparator = () => (
    <div className="w-full h-[2px] bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-full" />
  );

  const Panel = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-2xl border-2 border-black bg-[#2c2c2c] shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
      {children}
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">
        {/* Store image upload UI for owner only */}
        {isOwner && (
          <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <CardHeader>
              <CardTitle>Update Store Image</CardTitle>
              <CardDescription>
                Upload a new banner image. This updates your store page and store cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => onPickStoreImage(e.target.files?.[0] ?? null)}
              />
              {newStoreImagePreviewUrl && (
                <img
                  src={newStoreImagePreviewUrl}
                  alt="New store image preview"
                  className="w-full max-h-[260px] object-contain rounded-md border-2 border-black bg-muted"
                />
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="comic-button"
                  disabled={uploadingStoreImage || !newStoreImageFile}
                  onClick={uploadStoreImage}
                >
                  {uploadingStoreImage ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero / header */}
        <Panel>
          <div className="relative overflow-visible rounded-xl">
            <div className="relative h-40 xs:h-48 sm:h-56 md:h-[320px] border-b-4 border-black overflow-visible">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt={`${storeName} store banner`}
                className="h-full w-full object-contain bg-muted rounded-xl store-banner-img"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackApplied === '1') return;
                  img.dataset.fallbackApplied = '1';
                  img.src = '/SPOTLIGHT.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent store-banner-gradient" />
              {/* Tape corners must be after the image to appear on top */}
              <div className="tape-corner top-left z-10" />
              <div className="tape-corner top-right z-10" />
              <div className="tape-corner bottom-left z-10" />
              <div className="tape-corner bottom-right z-10" />
            </div>

            <div className="p-3 xs:p-4 md:p-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-2 sm:gap-4 min-w-0 flex-col sm:flex-row sm:items-end">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-black comic-avatar-shadow bg-muted">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{storeName?.charAt(0).toUpperCase() || "S"}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h1 className="text-xl xs:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                    {storeName}
                  </h1>

                  <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                    {ratingCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <RenderStars avg={ratingAverage} size={16} />
                        <span className="text-xs text-muted-foreground">
                          {ratingAverage?.toFixed(1)} • {ratingCount} review{ratingCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No reviews yet</span>
                    )}

                    {itemsSold > 0 && (
                      <Badge variant="outline" className="text-[11px] border-red-500/40 bg-muted/40">
                        {itemsSold} item{itemsSold === 1 ? "" : "s"} sold
                      </Badge>
                    )}
                  </div>

                  {about && (
                    <p className="mt-2 text-xs xs:text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                      {about}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 md:items-end w-full sm:w-auto">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyStoreUrl}
                    className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                  >
                    Copy Store URL
                  </Button>

                  <Button asChild size="sm" className="comic-button">
                    <Link
                      href={`/messages/new?sellerUid=${encodeURIComponent(
                        store.ownerUid,
                      )}&storeId=${encodeURIComponent(storeIdForLinks)}`}
                      className="gap-2 inline-flex items-center"
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
                    className="text-xs px-2 h-8 border border-red-500/30 bg-muted/20 hover:bg-muted/40"
                  >
                    <Link href="/profile">Edit profile / store info</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Listings */}
        <Panel>
          <div className="p-3 xs:p-4 md:p-6 space-y-3">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold tracking-wide">Active listings</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {listingItems.length} listing{listingItems.length === 1 ? "" : "s"}
              </span>
            </div>

            <RedLineSeparator />

            {listingsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            )}

            {!listingsLoading && listingItems.length === 0 && (
              <div className="text-sm text-muted-foreground">No active listings yet.</div>
            )}

            {!listingsLoading && listingItems.length > 0 && (
              <div className="grid gap-2 xs:gap-3 grid-cols-1 sm:grid-cols-2">
                {listingItems.map((listing) => {
                  const img = listing.primaryImageUrl || listing.imageUrls?.[0];
                  const categoryLabel =
                    CATEGORY_LABELS[(listing.category as ListingDoc["category"]) || "OTHER"];

                  return (
                    <Link key={listing.id} href={`/listings/${listing.id}`} className="block">
                      <div className="h-full rounded-xl border-2 border-black bg-card/80 hover:bg-card transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
                        <div className="flex gap-2 xs:gap-3 p-2 xs:p-3">
                          <div className="relative h-20 w-20 xs:h-24 xs:w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-black bg-muted">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={listing.title}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="h-full w-full grid place-items-center text-[11px] text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <p className="text-xs xs:text-sm font-bold leading-snug line-clamp-2">
                                {listing.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 xs:gap-2">
                                <span className="text-base xs:text-lg font-extrabold text-primary">
                                  ${Number(listing.price || 0).toFixed(2)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-red-500/40 bg-muted/40"
                                >
                                  {categoryLabel}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[11px] xs:text-xs text-muted-foreground">
                              <span>{listing.quantityAvailable} in stock</span>
                              {listing.createdText && <span>Listed {listing.createdText}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>

        {/* Reviews */}
        <Panel>
          <div className="p-3 xs:p-4 md:p-6 space-y-3">
            <div className="flex items-center gap-1 xs:gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-base font-bold tracking-wide">Recent reviews</h2>
            </div>

            <RedLineSeparator />

            {reviewsLoading && (
              <div className="space-y-1 xs:space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!reviewsLoading && reviewItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                <div className="text-3xl mb-2">⭐</div>
                <div className="font-semibold mb-1">No reviews yet</div>
                <div className="mb-2 text-xs">Completed orders will show up here once buyers leave feedback.</div>
              </div>
            )}

            {!reviewsLoading && reviewItems.length > 0 && (
              <div className="space-y-1 xs:space-y-2">
                {reviewItems
                  .sort(
                    (a, b) => (b.created?.getTime?.() || 0) - (a.created?.getTime?.() || 0),
                  )
                  .slice(0, 10)
                  .map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
                    >
                      <div className="flex items-start gap-2 xs:gap-3 p-2 xs:p-3">
                        <div className="mt-0.5">
                          <RenderStars avg={review.rating} size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs xs:text-sm">{review.comment || "No comment provided."}</p>
                          <p className="mt-1 text-[11px] xs:text-xs text-muted-foreground">
                            From order #{review.orderId?.slice?.(0, 8) || ""}
                            {review.createdText ? ` • ${review.createdText}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </AppLayout>
  );
}
