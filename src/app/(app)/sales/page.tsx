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

export default function SalesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Build query ONLY when auth + firestore are ready and user is a seller
  const salesQuery = useMemoFirebase(() => {
    if (authLoading || !firestore || !user) return null;

    return query(
      collection(firestore, 'orders'),
      where('sellerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid, authLoading]);

  const { data: sales, isLoading } = useCollection<Order>(salesQuery);

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div>Loading your sales...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Sales</h1>
          <p className="text-muted-foreground">
            Orders where you are the seller.
          </p>
        </div>

        {isLoading && (
          <div>Loading sales...</div>
        )}

        {!isLoading && (!sales || sales.length === 0) && (
          <p className="text-muted-foreground">You don&apos;t have any sales yet.</p>
        )}

        {!isLoading && sales && sales.length > 0 && (
          <div className="space-y-4">
            {sales.map((order) => {
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
                      <span className="text-muted-foreground">Buyer</span>
                      <span className="font-medium">{order.buyerName || order.buyerUid}</span>
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
