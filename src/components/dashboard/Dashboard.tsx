'use client';
import { useAuth } from '@/hooks/use-auth';
import StoreCard from '../StoreCard';
import ListingCard from '../ListingCard';
import { Button } from '../ui/button';
import { useVault } from '@/lib/vault';
import { VaultModal } from '../VaultModal';
import { useState } from 'react';
import { Flame } from 'lucide-react';
import PlaceholderContent from '../PlaceholderContent';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import type { Store, Listing } from '@/lib/types';


export default function Dashboard() {
  const { profile, loading: isProfileLoading } = useAuth();
  const { isVaultButtonVisible } = useVault();
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const firestore = useFirestore();

  const storesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'storefronts'), limit(2));
  }, [firestore]);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'listings'), limit(4));
  }, [firestore]);

  const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection<Listing>(listingsQuery);

  if (isProfileLoading) {
    return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;
  }

  return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.name}!</h1>
          {isVaultButtonVisible && (
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90 animate-pulse"
              onClick={() => setIsVaultModalOpen(true)}
            >
              <Flame className="mr-2 h-4 w-4" />
              Unlock The Vault
            </Button>
          )}
        </div>

        <section className="bg-slate-800 text-white -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-8 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Spotlight Stores</h2>
          {storesLoading && <p>Loading stores...</p>}
          {stores && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>

        <section>
          <PlaceholderContent 
            title="In Search Of (ISO24)"
            description="This section will show active ISO24 posts from the community. Feature coming soon!"
          />
        </section>

        <section>
            <PlaceholderContent 
                title="New Users"
                description="This section will highlight recently created or newly active stores. Feature coming soon!"
            />
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">New Items</h2>
          {listingsLoading && <p>Loading new items...</p>}
          {listings && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
           {(!listings || listings.length === 0) && !listingsLoading && <p>No new items found.</p>}
        </section>

        <section>
            <PlaceholderContent 
                title="Recommended Items"
                description="This section will recommend items based on your interests. Feature coming soon!"
            />
        </section>

        <VaultModal open={isVaultModalOpen} onOpenChange={setIsVaultModalOpen} />
      </div>
  );
}
