'use client';

import { useAuth } from '@/hooks/use-auth';
import StoreCard from '../StoreCard';
import ListingCard from '../ListingCard';
import { Button } from '../ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, limit, query, orderBy, where } from 'firebase/firestore';
import type { Store, Listing } from '@/lib/types';
import { StandaloneVaultDoor } from './StandaloneVaultDoor';

export default function Dashboard() {
  const { profile, loading: isProfileLoading } = useAuth();
  const firestore = useFirestore();

  // Spotlight stores
  const storesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'storefronts'),
      where('isSpotlighted', '==', true),
      limit(2)
    );
  }, [firestore]);

  // New listings
  const listingsQuery = useMemoFirebase(() => {
    if (isProfileLoading || !firestore) return null;
    return query(
      collection(firestore, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(4)
    );
  }, [firestore, isProfileLoading]);

  const { data: stores, isLoading: storesLoading } =
    useCollection<Store>(storesQuery);
  const { data: listings, isLoading: listingsLoading } =
    useCollection<Listing>(listingsQuery);

  if (isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top header */}
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {profile?.displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse spotlight stores, check what&apos;s new, and try to unlock the vault.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="hidden sm:inline-flex"
          >
            <a href="/search">Search VaultVerse</a>
          </Button>
        </div>
      </header>

      {/* Unlock the Vault with animated door */}
      <section className="rounded-xl border bg-card/60 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
             
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
             
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <StandaloneVaultDoor />
        </div>
      </section>

      {/* Store Spotlight */}
      <section className="rounded-xl border bg-card/60 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Store Spotlight
          </h2>
        </div>

        {storesLoading && <p>Loading spotlight stores...</p>}

        {stores && stores.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {stores.map((store) => (
              <StoreCard key={store.storeId} store={store} />
            ))}
          </div>
        ) : !storesLoading ? (
          <p className="text-sm text-muted-foreground">
            No spotlight stores yet. When sellers buy a spotlight slot, they&apos;ll appear here.
          </p>
        ) : null}
      </section>

      {/* New Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">New Items</h2>
        </div>

        {listingsLoading && <p>Loading new items...</p>}

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : !listingsLoading ? (
          <p className="text-sm text-muted-foreground">
            No new items listed yet. Be the first to list something.
          </p>
        ) : null}
      </section>
    </div>
  );
}
