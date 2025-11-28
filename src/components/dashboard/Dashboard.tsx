'use client';
import { useAuth } from '@/lib/auth';
import StoreCard from '../StoreCard';
import { mockStores, mockListings } from '@/lib/data';
import ListingCard from '../ListingCard';
import { Button } from '../ui/button';
import { useVault } from '@/lib/vault';
import { VaultModal } from '../VaultModal';
import { useState } from 'react';
import { Flame } from 'lucide-react';
import AppLayout from '../layout/AppLayout';
import PlaceholderContent from '../PlaceholderContent';

export default function Dashboard() {
  const { user } = useAuth();
  const { isVaultButtonVisible } = useVault();
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}!</h1>
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

        <section className="bg-slate-800 text-white -mx-8 px-8 py-8 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Spotlight Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockListings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <section>
            <PlaceholderContent 
                title="Recommended Items"
                description="This section will recommend items based on your interests. Feature coming soon!"
            />
        </section>

        <VaultModal open={isVaultModalOpen} onOpenChange={setIsVaultModalOpen} />
      </div>
    </AppLayout>
  );
}
