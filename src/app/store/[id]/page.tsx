"use client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import React from "react";
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
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import PlaceholderContent from "@/components/PlaceholderContent";
import { useAuth } from "@/hooks/use-auth";
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { useToast } from "@/hooks/use-toast";
import { storeThemes } from "@/lib/storeThemes";
import marqueeStyles from "./marqueeBanner.module.css";
import themeBannerStyles from "./themeBanners.module.css";
import storeThemePreviewStyles from "./storeThemePreview.module.css";

// StoreDoc type for storefronts collection
type StoreDoc = {
  id?: string;
  ownerUid: string;
  displayName?: string;
  storeName?: string;
  slug?: string;
  about?: string;
  avatar?: string;
  avatarUrl?: string;
  storeImageUrl?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
  status?: "ACTIVE" | "HIDDEN" | "DISABLED";
  isSpotlighted?: boolean;
  spotlightUntil?: any;
  createdAt?: any;
  updatedAt?: any;
};

// ListingDoc type for listings collection
// This matches the structure used in listings and fixes type errors
export type ListingDoc = {
  id: string;
  listingId?: string;
  storeId: string;
  ownerId?: string;
  title: string;
  category?: string;
  description?: string;
  price?: number;
  condition?: string;
  quantityTotal?: number;
  quantityAvailable?: number;
  state?: string;
  tags?: string[];
  imageUrls?: string[];
  primaryImageUrl?: string | null;
  createdAt?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
};

import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, getDocs, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { storage } from "@/firebase/client-provider";
import StoreHeader from "../../hobbydork-store/themes/StoreHeader";

// Add this type definition for ReviewDoc
type ReviewDoc = {
  id?: string;
  rating?: number;
  comment?: string;
  orderId?: string;
  createdAt?: { toDate?: () => Date };
  // Add other fields as needed
};

import SellerSidebar from '@/components/dashboard/SellerSidebar';

const CATEGORY_LABELS: Record<NonNullable<ListingDoc["category"]>, string> = {
  COMIC_BOOKS: "Comic books",
  SPORTS_CARDS: "Sports cards",
  POKEMON_CARDS: "Pokémon cards",
  VIDEO_GAMES: "Video games",
  TOYS: "Toys",
  OTHER: "Other",
};

// Fix RenderStars to accept undefined
function RenderStars({ avg, size = 14 }: { avg: number | null | undefined; size?: number }) {
  const value = Math.max(0, Math.min(5, avg ?? 0));
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  return (
    <span className="flex items-center">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} className="text-yellow-500" style={{ width: size, height: size }} />
      ))}
      {half && <StarHalf className="text-yellow-500" style={{ width: size, height: size }} />}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <Star key={i + full + 1} className="text-gray-300" style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

// --- MAIN STORE PAGE FUNCTION ---
export default function StorePage() {
  // --- HOOKS ---
  const [ownerName, setOwnerName] = React.useState("");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storeIdParam = params?.id;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: authLoading, profile } = useAuth();
  const [effectiveStoreId, setEffectiveStoreId] = React.useState<string | undefined>(storeIdParam);
  // Only show create giveaway button if user is seller and owns this store
  const canCreateGiveaway = user && profile?.isSeller && profile?.storeId === effectiveStoreId;
  const canReadFirestore = !authLoading;
  // Always default to "default" theme unless explicitly set
  const [sellerTheme, setSellerTheme] = React.useState<string>("default");
  const [newStoreImageFile, setNewStoreImageFile] = React.useState<File | null>(null);
  const [newStoreImagePreviewUrl, setNewStoreImagePreviewUrl] = React.useState<string | null>(null);
  const [uploadingStoreImage, setUploadingStoreImage] = React.useState(false);
  const [sellerTier, setSellerTier] = React.useState<string | undefined>(undefined);

  // THEME CSS VARS - always fallback to default
  const theme = storeThemes[sellerTheme] || storeThemes["default"];
  React.useEffect(() => {
    const appliedTheme = storeThemes[sellerTheme] || storeThemes["default"];
    if (!appliedTheme) return;
    const root = document.documentElement;
    root.style.setProperty('--store-primary', appliedTheme.colors.primary);
    root.style.setProperty('--store-background', appliedTheme.colors.background);
    root.style.setProperty('--store-accent', appliedTheme.colors.accent);
    root.style.setProperty('--store-text', appliedTheme.colors.text);
    if (appliedTheme.fontFamily) root.style.setProperty('--store-font', appliedTheme.fontFamily);
    if (appliedTheme.borderRadius) root.style.setProperty('--store-radius', appliedTheme.borderRadius);
    return () => {
      root.style.removeProperty('--store-primary');
      root.style.removeProperty('--store-background');
      root.style.removeProperty('--store-accent');
      root.style.removeProperty('--store-text');
      root.style.removeProperty('--store-font');
      root.style.removeProperty('--store-radius');
    };
  }, [sellerTheme]);

  React.useEffect(() => {
    setEffectiveStoreId(storeIdParam);
  }, [storeIdParam]);

  // FIRESTORE QUERIES (using 'storefronts')
  const storeRef = useMemoFirebase(() => {
    if (!firestore || !effectiveStoreId) return null;
    return doc(firestore, "storefronts", effectiveStoreId);
  }, [firestore, effectiveStoreId]);
  const { data: store, isLoading: storeLoading } = useDoc<StoreDoc>(storeRef as any);

  React.useEffect(() => {
    async function fetchSellerTheme() {
      if (!firestore || !store?.ownerUid) return;
      const userRef = doc(firestore, "users", store.ownerUid);
      try {
        const snap = await import("firebase/firestore").then(m => m.getDoc(userRef));
        if (snap.exists()) {
          setSellerTheme(snap.data().activeTheme || "default");
        } else {
          setSellerTheme("default");
        }
      } catch {
        setSellerTheme("default");
      }
    }
    if (store?.ownerUid) fetchSellerTheme();
  }, [firestore, store?.ownerUid]);

  React.useEffect(() => {
    return () => {
      if (newStoreImagePreviewUrl) URL.revokeObjectURL(newStoreImagePreviewUrl);
    };
  }, [newStoreImagePreviewUrl]);

  React.useEffect(() => {
    if (!firestore || !store?.ownerUid) return;
    const userRef = doc(firestore, "users", store.ownerUid);
    import("firebase/firestore").then(m => m.getDoc(userRef)).then(snap => {
      if (snap.exists()) {
        setSellerTier(snap.data().sellerTier || "BRONZE");
      } else {
        setSellerTier("BRONZE");
      }
    }).catch(() => setSellerTier("BRONZE"));
  }, [firestore, store?.ownerUid]);

  React.useEffect(() => {
    if (!canReadFirestore || !firestore) return;
    if (!storeIdParam) return;
    if (storeLoading) return;
    if (store) return;
    (async () => {
      try {
        const q = query(
          collection(firestore, "storefronts"),
          where("ownerId", "==", storeIdParam),
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
      return (
        <AppLayout sidebarComponent={<SellerSidebar />}>
          <div className="max-w-6xl mx-auto w-full px-2 xs:px-4 py-4">
            {canCreateGiveaway && (
              <div className="mb-4 flex justify-end">
                <Link href={`/store/${effectiveStoreId}/giveaway-create`}>
                  <Button variant="outline">Create Giveaway</Button>
                </Link>
              </div>
            )}
            {/* ...existing code... */}
          </div>
        </AppLayout>
      );
    }
    setUploadingStoreImage(true);
    try {
      // Define the storage reference for the store image
      const storageRef = ref(storage, `storefronts/${effectiveStoreId}/store-banner.jpg`);
      // Only upload if file is not null
      if (newStoreImageFile) {
        await uploadBytes(storageRef, newStoreImageFile);
        const url = await getDownloadURL(storageRef);
        await updateDoc(storeRef as any, { storeImageUrl: url, updatedAt: serverTimestamp() });
        toast({ title: "Store image updated" });
        onPickStoreImage(null);
      }
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

  if (user && store && user.uid === store.ownerUid && typeof window !== "undefined") {
    const canonicalPath = `/store/${store.id}`;
    if (window.location.pathname !== canonicalPath) {
      window.location.replace(canonicalPath);
      return null;
    }
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
  const storeName = store?.displayName || store?.storeName || ownerName || "Store";
  const avatarUrl = store.avatar || store?.avatarUrl || "/hobbydork-head.png";
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

  // --- MAIN RETURN ---
  return (
    <AppLayout sidebarComponent={isOwner ? <SellerSidebar /> : null }>
      <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">
        {/* DEBUG PANEL - REMOVE IN PRODUCTION */}
        <div className="mb-4 p-3 rounded bg-yellow-100 text-black text-xs border border-yellow-400">
          <div><b>DEBUG:</b></div>
          <div>user?.uid: {user?.uid || 'null'}</div>
          <div>store?.ownerUid: {store?.ownerUid || 'null'}</div>
          <div>isOwner: {String(isOwner)}</div>
          <div>store?.status: {store?.status || 'null'}</div>
        </div>

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
                    {sellerTier && (
                      <Badge
                        className={
                          sellerTier === 'GOLD'
                            ? 'flex items-center gap-1 text-[12px] font-extrabold border-yellow-400 bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-300 text-yellow-900 ring-2 ring-yellow-300 shadow-lg px-3 py-1 rounded-full'
                            : sellerTier === 'SILVER'
                            ? 'flex items-center gap-1 text-[12px] font-extrabold border-gray-300 bg-gradient-to-r from-gray-200 via-white to-gray-300 text-gray-700 ring-2 ring-gray-300 shadow-lg px-3 py-1 rounded-full'
                            : 'flex items-center gap-1 text-[12px] font-extrabold border-orange-400 bg-gradient-to-r from-orange-200 via-orange-100 to-yellow-100 text-orange-800 ring-2 ring-orange-300 shadow-lg px-3 py-1 rounded-full'
                        }
                        variant="outline"
                        style={{ letterSpacing: 0.5 }}
                      >
                        {sellerTier === 'GOLD' && <span className="inline-block mr-1 text-lg">🥇</span>}
                        {sellerTier === 'SILVER' && <span className="inline-block mr-1 text-lg">🥈</span>}
                        {sellerTier === 'BRONZE' && <span className="inline-block mr-1 text-lg">🥉</span>}
                        <span className="drop-shadow-sm tracking-wide">{sellerTier.charAt(0) + sellerTier.slice(1).toLowerCase()} Seller</span>
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
                  .sort((a, b) => (b.created?.getTime?.() || 0) - (a.created?.getTime?.() || 0))
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
