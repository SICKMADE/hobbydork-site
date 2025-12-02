'use client';

import AppLayout from '@/components/layout/AppLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function OrdersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Build query only when we have an authenticated user
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    return query(
      collection(firestore, 'orders'),
      where('buyerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, user?.uid]);

  const {
    data: orders,
    isLoading: ordersLoading,
    error,
  } = useCollection<Order>(ordersQuery);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-sm text-muted-foreground">
            These are your purchases (orders where you are the buyer).
          </p>
        </div>

        {authLoading && (
          <p className="text-sm text-muted-foreground">Checking your account…</p>
        )}

        {!authLoading && !user && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                You must be signed in to view your orders.
              </p>
            </CardContent>
          </Card>
        )}

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Your Purchases</CardTitle>
              <CardDescription>
                Orders you&apos;ve placed as a buyer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-red-500">
                  Failed to load orders. If this keeps happening, it&apos;s a
                  rules/index issue, not your account.
                </p>
              )}

              {ordersLoading && !error && (
                <p className="text-sm text-muted-foreground">Loading orders…</p>
              )}

              {!ordersLoading && !error && (!orders || orders.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  You have no orders yet.
                </p>
              )}

              {!ordersLoading &&
                !error &&
                orders &&
                orders.length > 0 && (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <Card key={order.id} className="border border-border">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {order.state || 'UNKNOWN'}
                              </Badge>
                              {order.createdAt && order.createdAt.toDate && (
                                <span className="text-xs text-muted-foreground">
                                  Placed{' '}
                                  {formatDistanceToNow(
                                    order.createdAt.toDate(),
                                    { addSuffix: true },
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Total
                              </p>
                              <p className="font-semibold">
                                $
                                {Number(order.totalPrice || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <Separator className="my-2" />

                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              <div>Order ID: {order.id}</div>
                              {order.storeName && (
                                <div>Store: {order.storeName}</div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              // wire this up to an order details page later if you want
                              disabled
                            >
                              View details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
