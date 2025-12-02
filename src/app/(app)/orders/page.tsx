'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (authLoading || !firestore || !user) return null;

    return query(
      collection(firestore, 'orders'),
      where('buyerUid', '==', user.uid)
      // no orderBy -> avoid composite index headaches; we sort client-side
    );
  }, [firestore, user?.uid, authLoading]);

  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  if (authLoading || ordersLoading) {
    return (
      <AppLayout>
        <div>Loading your orders…</div>
      </AppLayout>
    );
  }

  const sortedOrders =
    orders?.slice().sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime; // newest first
    }) ?? [];

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Orders</h1>

        {sortedOrders.length === 0 && (
          <p className="text-muted-foreground">You haven&apos;t bought anything yet.</p>
        )}

        <div className="space-y-3">
          {sortedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Order #{order.shortId ?? order.id}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Placed{' '}
                    {order.createdAt?.toDate
                      ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true })
                      : 'unknown time'}
                  </p>
                </div>
                <Badge variant="outline">{order.state}</Badge>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <span className="font-semibold">Seller:</span> {order.sellerName}
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
