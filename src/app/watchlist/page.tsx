
'use client';
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Listing, WatchlistItem } from "@/lib/types";
import PlaceholderContent from "@/components/PlaceholderContent";
import ListingCard from "@/components/ListingCard";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";

function WatchedListing({ listingId }: { listingId: string }) {
    const firestore = useFirestore();
    const listingRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'listings', listingId);
    }, [firestore, listingId]);

    const { data: listing, isLoading } = useDoc<Listing>(listingRef);

    if (isLoading) {
        return <div>Loading item...</div>;
    }

    if (!listing) {
        return null; // Or some placeholder for a listing that was deleted
    }

    return <ListingCard listing={listing} />;
}


export default function WatchlistPage() {
    const { profile } = useAuth();
    const firestore = useFirestore();

    const watchlistQuery = useMemoFirebase(() => {
        if (!firestore || !profile) return null;
        return collection(firestore, `users/${profile.uid}/watchlist`);
    }, [firestore, profile]);

    const { data: watchlistItems, isLoading } = useCollection<WatchlistItem>(watchlistQuery);

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
