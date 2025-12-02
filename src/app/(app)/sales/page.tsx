'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function MySalesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    // don’t even build the query until auth + profile are ready
    if (authLoading || !firestore || !user || !profile || !profile.isSeller) return null;

    return query(
      collection(firestore, 'orders'),
      where('sellerUid', '==', user.uid)
      // no orderBy; client-side sort
    );
  }, [firestore, user?.uid, profile?.isSeller, authLoading]);

  const { data: sales, isLoading: salesLoading } = useCollection<Order>(salesQuery);

  if (!profile?.isSeller) {
    return (
      <AppLayout>
        <div>You are not a seller yet.</div>
      </AppLayout>
    );
  }

  if (authLoading || salesLoading) {
    return (
      <AppLayout>
        <div>Loading your sales…</div>
      </AppLayout>
    );
  }

  const sortedSales =
    sales?.slice().sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    }) ?? [];

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Sales</h1>

        {sortedSales.length === 0 && (
          <p className="text-muted-foreground">You haven&apos;t sold anything yet.</p>
        )}

        <div className="space-y-3">
          {sortedSales.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Order #{order.shortId ?? order.id}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Sold{' '}
                    {order.createdAt?.toDate
                      ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true })
                      : 'unknown time'}
                  </p>
                </div>
                <Badge variant="outline">{order.state}</Badge>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <span className="font-semibold">Buyer:</span> {order.buyerName}
                </p>
                <p>
                  <span className="font-semibold">Total:</span> $
                  {Number(order.totalAmount ?? 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
