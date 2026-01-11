
'use client';

import Link from 'next/link';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';

type ListingDoc = {
  id?: string;
  title?: string;
  status?: string;
  price?: number;
  ownerUid?: string;
  createdAt?: Timestamp;
};

type Iso24Doc = {
  id?: string;
  title?: string;
  ownerUid?: string;
  createdAt?: Timestamp;
};

type OrderDoc = {
  id?: string;
  buyerUid?: string;
  storeId?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: Timestamp;
};

function formatDate(ts?: Timestamp) {
  if (!ts) return '';
  const d = ts.toDate();
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export default function ActivityPage() {
  const { user, profile, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return null;
  const firestore = useFirestore();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    profile?.status === "ACTIVE";

  const listingsQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !user?.uid) return null;
    const ref = collection(firestore, 'listings');
    return query(
      ref,
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
  }, [canReadFirestore, firestore, user?.uid]);

  const isoQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !user?.uid) return null;
    const ref = collection(firestore, 'iso24Posts');
    return query(
      ref,
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
  }, [canReadFirestore, firestore, user?.uid]);

  const ordersQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !user?.uid) return null;
    const ref = collection(firestore, 'orders');
    return query(
      ref,
      where('buyerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
  }, [canReadFirestore, firestore, user?.uid]);

  const { data: listings, isLoading: loadingListings } =
    useCollection<ListingDoc>(canReadFirestore ? listingsQuery : null);
  const { data: isoPosts, isLoading: loadingIso } =
    useCollection<Iso24Doc>(canReadFirestore ? isoQuery : null);
  const { data: orders, isLoading: loadingOrders } =
    useCollection<OrderDoc>(canReadFirestore ? ordersQuery : null);

  if (!user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="text-2xl font-bold">My Activity</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to be signed in to see your recent activity.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Activity
        </h1>

        {/* Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My Listings</span>
              <Link href="/listings">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingListings && (
              <p className="text-xs text-muted-foreground">Loading listings…</p>
            )}
            {!loadingListings && (!listings || listings.length === 0) && (
              <p className="text-xs text-muted-foreground">
                You haven&apos;t created any listings yet.
              </p>
            )}
            {listings?.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{l.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(l.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {l.status && (
                    <Badge variant="outline" className="text-[10px]">
                      {l.status}
                    </Badge>
                  )}
                  {typeof l.price === 'number' && (
                    <span className="text-xs font-semibold">
                      ${l.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ISO24 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My ISO24 Posts</span>
              <Link href="/iso24">
                <Button variant="outline" size="sm">
                  View ISO24
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingIso && (
              <p className="text-xs text-muted-foreground">Loading ISO24 posts…</p>
            )}
            {!loadingIso && (!isoPosts || isoPosts.length === 0) && (
              <p className="text-xs text-muted-foreground">
                You haven&apos;t posted any ISO24 yet.
              </p>
            )}
            {isoPosts?.map((iso) => (
              <div
                key={iso.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{iso.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(iso.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My Orders (as buyer)</span>
              <Link href="/orders">
                <Button variant="outline" size="sm">
                  View orders
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingOrders && (
              <p className="text-xs text-muted-foreground">Loading orders…</p>
            )}
            {!loadingOrders && (!orders || orders.length === 0) && (
              <p className="text-xs text-muted-foreground">
                You haven&apos;t placed any orders yet.
              </p>
            )}
            {orders?.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-muted-foreground">
                    Order ID: {o.id}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {o.status && (
                    <Badge variant="outline" className="text-[10px]">
                      {o.status}
                    </Badge>
                  )}
                  {typeof o.totalAmount === 'number' && (
                    <span className="text-xs font-semibold">
                      ${o.totalAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
