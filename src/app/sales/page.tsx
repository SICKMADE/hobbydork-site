'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type OrderState =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

type OrderDoc = {
  id: string;
  buyerUid: string;
  sellerUid: string;
  state: OrderState;
  items: {
    title?: string;
    quantity?: number;
    price?: number;
  }[];
  subtotal: number;
  createdAt?: any;
};

function statusColor(state: OrderState) {
  switch (state) {
    case 'PENDING_PAYMENT':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return '';
  }
}

export default function SalesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('sellerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, user?.uid]);

  const { data: orders, isLoading } =
    useCollection<OrderDoc>(salesQuery as any);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in required"
          description="You must be logged in to view your sales."
        />
      </AppLayout>
    );
  }

  if (!userData?.isSeller) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Not a seller"
          description="Complete seller onboarding to manage sales."
        >
          <Button asChild>
            <Link href="/become-seller">Become a seller</Link>
          </Button>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">My Sales</h1>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && (!orders || orders.length === 0) && (
          <PlaceholderContent
            title="No sales yet"
            description="Paid orders will appear here once buyers checkout."
          />
        )}

        {!isLoading &&
          orders?.map((order) => {
            const firstItem = order.items?.[0];
            const totalQty = order.items?.reduce(
              (sum, i) => sum + (i.quantity || 0),
              0,
            );

            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">
                      {firstItem?.title || 'Order'}
                      {totalQty > 1 && ` (+${totalQty - 1} more)`}
                    </CardTitle>
                    <div className="mt-1">
                      <Badge className={statusColor(order.state)}>
                        {order.state}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right text-sm font-medium">
                    ${order.subtotal.toFixed(2)}
                  </div>
                </CardHeader>

                <CardContent className="flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/orders/${order.id}`}>
                      View order
                    </Link>
                  </Button>

                  {order.state === 'PAID' && (
                    <span className="text-sm text-green-600 font-semibold">
                      Ready to ship
                    </span>
                  )}

                  {order.state === 'PENDING_PAYMENT' && (
                    <span className="text-sm text-yellow-600">
                      Awaiting payment
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </AppLayout>
  );
}
