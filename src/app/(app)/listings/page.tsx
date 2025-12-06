'use client';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Listing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import { useMemo, useState } from 'react';

export default function MyListingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(
    null,
  );

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.uid) return null;

    return query(
      collection(firestore, 'listings'),
      where('ownerUid', '==', profile.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, profile?.uid]);

  const { data: listings, isLoading: listingsLoading } =
    useCollection<Listing>(listingsQuery);

  const stats = useMemo(() => {
    const all = (listings as any[]) || [];
    const total = all.length;
    const active = all.filter((l) => l.state === 'ACTIVE')
      .length;
    const inventory = all.filter(
      (l) =>
        l.state !== 'ACTIVE' &&
        l.state !== 'SOLD_OUT' &&
        l.state !== 'COMPLETED',
    ).length;
    const sold = all.filter(
      (l) =>
        l.state === 'SOLD_OUT' || l.state === 'COMPLETED',
    ).length;

    return { total, active, inventory, sold };
  }, [listings]);

  const handleToggleVisibility = async (listing: any) => {
    if (!firestore) return;
    const id: string | undefined =
      listing.id || listing.listingId;
    if (!id) return;

    const currentState: string = listing.state ?? 'ACTIVE';
    const nextState =
      currentState === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setUpdatingId(id);
      await updateDoc(doc(firestore, 'listings', id), {
        state: nextState,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4">Loading...</div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to manage your listings"
          description="Log in to create and manage your listings."
        >
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push('/login')}>
              Sign in
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header / stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              My Listings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage what is for sale vs private inventory.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Badge variant="outline">
              Total: {stats.total}
            </Badge>
            <Badge>
              Active for sale: {stats.active}
            </Badge>
            <Badge variant="outline">
              Inventory: {stats.inventory}
            </Badge>
            <Badge variant="outline">Sold: {stats.sold}</Badge>
          </div>
        </div>

        {/* Create listing button */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Toggle a listing between{' '}
            <span className="font-semibold">For sale</span> and{' '}
            <span className="font-semibold">Inventory</span>.
          </p>
          <Button
            size="sm"
            onClick={() => router.push('/listings/create')}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New listing
          </Button>
        </div>

        {/* Content */}
        {listingsLoading && (
          <div className="text-sm text-muted-foreground">
            Loading your listings...
          </div>
        )}

        {!listingsLoading &&
          listings &&
          listings.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(listings as any[]).map((listing) => {
                const id: string =
                  listing.id || listing.listingId;
                const state: string =
                  listing.state ?? 'ACTIVE';
                const isActive = state === 'ACTIVE';
                const isSoldOut =
                  state === 'SOLD_OUT' ||
                  state === 'COMPLETED';

                let stateLabel = 'Inventory';
                if (isActive) stateLabel = 'For sale';
                else if (isSoldOut) stateLabel = 'Sold out';

                return (
                  <div
                    key={id}
                    className="flex flex-col gap-2"
                  >
                    <ListingCard listing={listing} />
                    <div className="flex items-center justify-between text-[11px]">
                      <Badge
                        variant={
                          isActive
                            ? 'default'
                            : isSoldOut
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {stateLabel}
                      </Badge>
                      {!isSoldOut && (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={updatingId === id}
                          onClick={() =>
                            handleToggleVisibility(
                              listing,
                            )
                          }
                        >
                          {updatingId === id
                            ? 'Updating...'
                            : isActive
                            ? 'Move to inventory'
                            : 'List for sale'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {!listingsLoading &&
          (!listings || listings.length === 0) && (
            <PlaceholderContent
              title="No listings yet"
              description="Click the button above to create your first listing and start selling."
            >
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() =>
                    router.push('/listings/create')
                  }
                >
                  Create a listing
                </Button>
              </div>
            </PlaceholderContent>
          )}
      </div>
    </AppLayout>
  );
}
