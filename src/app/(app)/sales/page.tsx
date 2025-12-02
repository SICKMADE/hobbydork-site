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

export default function SalesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const isSeller = !!profile?.isSeller;

  // Build query only when we have a seller with a user
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isSeller) return null;

    return query(
      collection(firestore, 'orders'),
      where('sellerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, user?.uid, isSeller]);

  const {
    data: sales,
    isLoading: salesLoading,
    error,
  } = useCollection<Order>(salesQuery);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Sales</h1>
          <p className="text-sm text-muted-foreground">
            Orders where you are the seller.
          </p>
        </div>

        {authLoading && (
          <p className="text-sm text-muted-foreground">Checking your account…</p>
        )}

        {!authLoading && !user && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                You must be signed in to view your sales.
              </p>
            </CardContent>
          </Card>
        )}

        {user && !isSeller && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                You don&apos;t have a store yet. Create a store to start selling.
              </p>
            </CardContent>
          </Card>
        )}

        {user && isSeller && (
          <Card>
            <CardHeader>
              <CardTitle>Your Sales</CardTitle>
              <CardDescription>
                Orders placed on your store.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-red-500">
                  Failed to load sales. If this keeps happening, it&apos;s a
                  rules/index issue, not your account.
                </p>
              )}

              {salesLoading && !error && (
                <p className="text-sm text-muted-foreground">Loading sales…</p>
              )}

              {!salesLoading && !error && (!sales || sales.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  You have no sales yet.
                </p>
              )}

              {!salesLoading &&
                !error &&
                sales &&
                sales.length > 0 && (
                  <div className="space-y-3">
                    {sales.map((order) => (
                      <Card key={order.id} className="border border-border">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {order.state || 'UNKNOWN'}
                              </Badge>
                              {order.createdAt && order.createdAt.toDate && (
                                <span className="text-xs text-muted-foreground">
                                  Created{' '}
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
                              {order.buyerName && (
                                <div>Buyer: {order.buyerName}</div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              // wire up to a detailed sales view later if you want
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
