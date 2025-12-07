'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MyListingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isSeller = !!profile?.isSeller && !!profile?.storeId;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login?redirect=/listings');
      return;
    }

    if (!isSeller) {
      router.replace('/store/setup?redirect=/listings');
      return;
    }
  }, [authLoading, user, isSeller, router]);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.uid) return null;

    return query(
      collection(firestore, 'listings'),
      where('ownerUid', '==', profile.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, profile?.uid]);

  const {
    data: listings,
    isLoading: listingsLoading,
  } = useCollection<any>(listingsQuery);

  const stats = useMemo(() => {
    if (!listings || !listings.length) {
      return { total: 0, active: 0, inventory: 0, sold: 0 };
    }

    let total = listings.length;
    let active = 0;
    let inventory = 0;
    let sold = 0;

    for (const listing of listings) {
      const state = listing.state ?? 'ACTIVE';
      const quantityAvailable = listing.quantityAvailable ?? 0;

      if (quantityAvailable <= 0) {
        sold++;
      } else if (state === 'ACTIVE') {
        active++;
      } else {
        inventory++;
      }
    }

    return { total, active, inventory, sold };
  }, [listings]);

  const handleToggleVisibility = async (listing: any) => {
    if (!firestore) return;
    const id: string | undefined = listing.id || listing.listingId;
    if (!id) return;

    const currentState: string = listing.state ?? 'ACTIVE';
    const nextState = currentState === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

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

  if (!user || !isSeller) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-sm text-muted-foreground">
              Manage what is for sale vs private inventory.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Badge variant="outline">Total: {stats.total}</Badge>
            <Badge>Active for sale: {stats.active}</Badge>
            <Badge variant="outline">Inventory: {stats.inventory}</Badge>
            <Badge variant="outline">Sold: {stats.sold}</Badge>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Toggle a listing between <span className="font-semibold">For sale</span> and{' '}
            <span className="font-semibold">Inventory</span>.
          </p>
          <Button size="sm" onClick={() => router.push('/listings/create')}>
            Create a listing
          </Button>
        </div>

        {listingsLoading && (
          <div className="text-sm text-muted-foreground">Loading your listings...</div>
        )}

        {!listingsLoading && listings && listings.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((listing: any) => {
              const id: string | undefined = listing.id || listing.listingId;
              const state: string = listing.state ?? 'ACTIVE';
              const quantityAvailable: number = listing.quantityAvailable ?? 0;

              const isActive = state === 'ACTIVE' && quantityAvailable > 0;
              const isSoldOut = quantityAvailable <= 0;

              let stateLabel = '';
              if (isSoldOut) stateLabel = 'Sold out';
              else if (isActive) stateLabel = 'For sale';
              else stateLabel = 'Inventory';

              return (
                <div key={id} className="border rounded-lg p-3 flex flex-col gap-2">
                  <div className="text-sm font-semibold line-clamp-2">
                    {listing.title || 'Untitled listing'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {typeof listing.price === 'number'
                      ? `$${listing.price.toFixed(2)}`
                      : listing.price ?? ''}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <Badge
                      variant={
                        isActive ? 'default' : isSoldOut ? 'secondary' : 'outline'
                      }
                    >
                      {stateLabel}
                    </Badge>
                    {!isSoldOut && (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={updatingId === id}
                        onClick={() => handleToggleVisibility(listing)}
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

        {!listingsLoading && (!listings || listings.length === 0) && (
          <PlaceholderContent
            title="No listings yet"
            description="Click the button above to create your first listing and start selling."
          >
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push('/listings/create')}>
                Create a listing
              </Button>
            </div>
          </PlaceholderContent>
        )}
      </div>
    </AppLayout>
  );
}
