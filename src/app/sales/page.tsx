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

import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

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
  const { user, profile, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return null;
  if (profile?.status !== "ACTIVE") return null;
  const firestore = useFirestore();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    //
    profile?.status === "ACTIVE";

  const salesQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders') as any,
      where('sellerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [canReadFirestore, firestore, user?.uid]);

  const { data: orders, isLoading } =
    useCollection<any>(canReadFirestore ? salesQuery : null);

  // Tab state
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  // Filter orders by tab
  const activeStates = ['PENDING_PAYMENT', 'PAID', 'SHIPPED'];
  const completedStates = ['COMPLETED', 'CANCELLED'];
  const filteredOrders = tab === 'active'
    ? (orders || []).filter((o: OrderDoc) => activeStates.includes(o.state))
    : (orders || []).filter((o: OrderDoc) => completedStates.includes(o.state));

  if (!profile?.isSeller) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background items-center justify-center">
          <SellerSidebar />
          <div className="flex-1 flex items-center justify-center">
            <AppLayout>
              <PlaceholderContent title="Not a seller" description="You must be a seller to view sales." />
            </AppLayout>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 flex flex-col items-center justify-start p-6 bg-background">
          <img src="/myorders.png" alt="My Sales" className="w-full max-w-2xl h-32 object-contain mx-auto mb-6 drop-shadow-lg" />
          {/* Tabs */}
          <div className="flex gap-4 mb-8 justify-center w-full max-w-2xl">
            <div className="flex flex-col items-center">
              <button
                className={`px-6 py-2 rounded-full font-bold text-lg border-4 shadow-xl active:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-destructive custom-btn-shadow custom-letter custom-textshadow
                  ${tab === 'active' ? 'bg-destructive text-white border-destructive scale-105 active:translate-y-1 active:border-b-2 active:border-r-2 shadow-[0_8px_0_#7f1d1d,0_2px_8px_#000]' : 'bg-card text-gray-400 border-gray-700 hover:bg-destructive/10 shadow-[0_4px_0_#374151,0_2px_8px_#000]'}
                  drop-shadow-3xl'`}
                onClick={() => setTab('active')}
              >
                Active Sales
              </button>
            </div>
            <div className="flex flex-col items-center">
              <button
                className={`px-6 py-2 rounded-full font-bold text-lg border-4 shadow-xl active:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-destructive custom-btn-shadow custom-letter custom-textshadow
                  ${tab === 'completed' ? 'bg-destructive text-white border-destructive scale-105 active:translate-y-1 active:border-b-2 active:border-r-2 shadow-[0_8px_0_#7f1d1d,0_2px_8px_#000]' : 'bg-card text-gray-400 border-gray-700 hover:bg-destructive/10 shadow-[0_4px_0_#374151,0_2px_8px_#000]'}
                  drop-shadow-3xl'`}
                onClick={() => setTab('completed')}
              >
                Completed Sales
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-6 text-center text-white bg-card border-2 border-destructive rounded-2xl custom-btn-shadow text-lg font-bold">No sales found.</div>
          )}

          <div className="flex flex-col gap-6 w-full max-w-3xl">
            {filteredOrders.map((order: OrderDoc) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <div className="bg-card border-4 border-destructive rounded-2xl custom-btn-shadow p-6 hover:bg-destructive/10 transition flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="font-extrabold text-xl text-white mb-1 tracking-wide drop-shadow-lg">{order.items?.[0]?.title ?? "Order"}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-base transition-all duration-150
                        ${order.state === 'COMPLETED' ? 'bg-green-600 border-green-400 text-white scale-110' : order.state === 'SHIPPED' ? 'bg-blue-600 border-blue-400 text-white scale-110' : order.state === 'PAID' ? 'bg-yellow-500 border-yellow-400 text-black scale-110' : order.state === 'PENDING_PAYMENT' ? 'bg-destructive border-destructive text-white scale-110' : 'bg-red-600 border-red-400 text-white scale-110'}`}
                      >
                        {order.state === 'PENDING_PAYMENT' ? '🕒' : order.state === 'PAID' ? '💰' : order.state === 'SHIPPED' ? '🚚' : order.state === 'COMPLETED' ? '✅' : order.state === 'CANCELLED' ? '❌' : '❓'}
                      </span>
                      <span className="font-bold text-base text-white">{order.state ?? 'N/A'}</span>
                    </div>
                    {order.createdAt && (
                      <div className="text-xs text-gray-300">Date: {order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                    )}
                    {order.buyerUid && <div className="text-xs text-gray-300 flex items-center gap-1"><span className="font-bold text-white">Buyer:</span> {order.buyerUid}</div>}
                  </div>
                  <div className="flex flex-col items-end justify-center min-w-[100px]">
                    <span className="text-2xl font-extrabold text-white drop-shadow-lg">${typeof order.subtotal === 'number' ? order.subtotal.toFixed(2) : 'N/A'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
