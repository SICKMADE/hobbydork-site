'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function OrdersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Build query ONLY when auth + firestore are ready
  const ordersQuery = useMemoFirebase(() => {
    if (authLoading || !firestore || !user) return null;

    return query(
      collection(firestore, 'orders'),
      where('buyerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid, authLoading]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div>Loading your orders...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">
            Orders where you are the buyer.
          </p>
        </div>

        {isLoading && (
          <div>Loading orders...</div>
        )}

        {!isLoading && (!orders || orders.length === 0) && (
          <p className="text-muted-foreground">You don&apos;t have any orders yet.</p>
        )}

        {!isLoading && orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const createdAtDate =
                (order.createdAt as any)?.toDate
                  ? (order.createdAt as any).toDate()
                  : null;

              return (
                <Card key={order.id || order.orderId}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.id || order.orderId || 'unknown'}
                      </CardTitle>
                      {createdAtDate && (
                        <p className="text-xs text-muted-foreground">
                          Placed {formatDistanceToNow(createdAtDate, { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{order.state}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Store</span>
                      <span className="font-medium">{order.storeName || order.storeId}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">
                        ${Number(order.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-1 text-sm">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.title || item.listingId}</span>
                          <span className="text-muted-foreground">
                            x{item.quantity} · ${Number(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
