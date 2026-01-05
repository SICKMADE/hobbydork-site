'use client';

import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { watchlistConverter } from "@/firebase/firestore/converters";
import type { Listing, WatchlistItem } from "@/lib/types";
import PlaceholderContent from "@/components/PlaceholderContent";
import ListingCard from "@/components/ListingCard";
import { useDoc } from "@/firebase/firestore/use-doc";

function WatchedListing({ listingId }: { listingId: string }) {
  const firestore = useFirestore();
  const { profile, loading: authLoading } = useAuth();
  const canQuery = !authLoading && profile && profile.uid;
  const listingRef = useMemoFirebase(() => {
    if (!canQuery || !firestore) return null;
    return doc(firestore, "listings", listingId);
  }, [canQuery, firestore, listingId]);

  const { data: listing, isLoading } = useDoc<Listing>(canQuery ? listingRef : null);

  if (isLoading) {
    return <div>Loading item...</div>;
  }

  if (!listing) {
    return null;
  }

  return <ListingCard listing={listing} />;
}

export default function ClientWatchlist() {
  const { user, profile, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return null;
  if (!user.emailVerified) return null;
  const firestore = useFirestore();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    profile?.emailVerified &&
    profile?.status === "ACTIVE";

  const watchlistQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !profile?.uid) return null;
    return collection(
      firestore,
      `users/${profile.uid}/watchlist`
    ).withConverter(watchlistConverter);
  }, [canReadFirestore, firestore, profile]);

  const { data: watchlistItems, isLoading } =
    useCollection<WatchlistItem>(canReadFirestore ? watchlistQuery : null);

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">My Watchlist</h1>
        {isLoading && <p>Loading your watchlist...</p>}
        {!isLoading && (!watchlistItems || watchlistItems.length === 0) && (
          <PlaceholderContent
            title="Your Watchlist is Empty"
            description="Add items to your watchlist to keep track of them here."
          />
        )}
        {!isLoading && watchlistItems && watchlistItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchlistItems.map((item) => (
              <WatchedListing key={item.listingId} listingId={item.listingId} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
