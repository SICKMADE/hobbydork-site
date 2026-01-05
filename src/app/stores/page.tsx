'use client';

import Link from 'next/link';
import Image from 'next/image';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

const DEFAULT_STORE_IMAGE = '/store.png';
const FALLBACK_STORE_IMAGE = '/SPOTLIGHT.png';

type StorefrontDoc = {
  id?: string;
  storeId?: string;
  storeName?: string;
  about?: string;
  avatarUrl?: string;
  storeImageUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  itemsSold?: number;
  status?: string;
};

export default function StoresPage() {
  const firestore = useFirestore();
  const { user, profile, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return null;
  if (!profile?.emailVerified) return null;
  const canReadFirestore =
    !authLoading &&
    !!user &&
    profile?.emailVerified &&
    profile?.status === "ACTIVE";

  const storesQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore) return null;
    const ref = collection(firestore, 'storefronts');
    return query(ref, where('status', '==', 'ACTIVE'), orderBy('createdAt', 'desc'));
  }, [canReadFirestore, firestore]);

  const { data: stores, isLoading } = useCollection<StorefrontDoc>(canReadFirestore ? storesQuery : null);

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Browse Stores
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover active HobbyDork sellers and their storefronts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <>
              <Card className="h-40 animate-pulse bg-muted/40" />
              <Card className="h-40 animate-pulse bg-muted/40" />
              <Card className="h-40 animate-pulse bg-muted/40" />
            </>
          )}

          {!isLoading && (!stores || stores.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No active stores yet.
            </p>
          )}

          {stores?.map((store) => {
            const id = store.storeId || store.id;
            if (!id) return null;

            const img = store.storeImageUrl || DEFAULT_STORE_IMAGE;

            return (
              <Link key={id} href={`/store/${id}`}>
                <Card className="flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={String(img)}
                      alt={store.storeName || 'Store image'}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.dataset.fallbackApplied === '1') return;
                        el.dataset.fallbackApplied = '1';
                        el.src = FALLBACK_STORE_IMAGE;
                      }}
                    />
                  </div>

                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="truncate text-base">
                      {store.storeName || 'Unnamed Store'}
                    </CardTitle>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {store.itemsSold
                          ? `${store.itemsSold} items sold`
                          : 'New store'}
                      </span>

                      {typeof store.ratingAverage === 'number' &&
                        store.ratingCount &&
                        store.ratingCount > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {store.ratingAverage.toFixed(1)}★ ({store.ratingCount})
                          </Badge>
                        )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4 pt-1">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {store.about || 'No description yet.'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
