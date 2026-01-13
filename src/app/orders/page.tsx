
"use client";
import Link from "next/link";
import BuyerSidebar from "@/components/dashboard/BuyerSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";


export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    // Strict Firestore read gate
    const canReadFirestore = !!user;
    if (!canReadFirestore) return;

    if (!db) return;
    const q = query(
      collection(db!, "orders"),
      where("buyerUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("[BuyerOrdersPage] Orders fetched:", ordersData);
      setOrders(ordersData);
    });

    return () => unsub();
  }, [user]);

  // Filter orders by tab
  const activeStates = ['PENDING_PAYMENT', 'PAID', 'SHIPPED'];
  const completedStates = ['DELIVERED', 'CANCELLED'];
  const filteredOrders = tab === 'active'
    ? orders.filter((o) => activeStates.includes(o.state))
    : orders.filter((o) => completedStates.includes(o.state));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <BuyerSidebar />
        <main className="flex-1 flex flex-col items-center justify-start p-6 bg-background">
          <img src="/myorders.png" alt="My Orders" className="w-full max-w-2xl h-32 object-contain mx-auto mb-6 drop-shadow-lg" />
          {/* Tabs */}
          <div className="flex gap-4 mb-8 justify-center w-full max-w-2xl">
            <div className="flex flex-col items-center">
              <button
                className={`px-6 py-2 rounded-full font-bold text-lg border-4 shadow-xl active:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-destructive custom-btn-shadow custom-letter custom-textshadow
                  ${tab === 'active' ? 'bg-destructive text-white border-destructive scale-105 active:translate-y-1 active:border-b-2 active:border-r-2 shadow-[0_8px_0_#7f1d1d,0_2px_8px_#000]' : 'bg-card text-gray-400 border-gray-700 hover:bg-destructive/10 shadow-[0_4px_0_#374151,0_2px_8px_#000]'}
                  drop-shadow-3xl'`}
                onClick={() => setTab('active')}
              >
                Active Orders
              </button>
              {/* Removed tiny dot indicator for cleaner look */}
            </div>
            <div className="flex flex-col items-center">
              <button
                className={`px-6 py-2 rounded-full font-bold text-lg border-4 shadow-xl active:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-destructive custom-btn-shadow custom-letter custom-textshadow
                  ${tab === 'completed' ? 'bg-destructive text-white border-destructive scale-105 active:translate-y-1 active:border-b-2 active:border-r-2 shadow-[0_8px_0_#7f1d1d,0_2px_8px_#000]' : 'bg-card text-gray-400 border-gray-700 hover:bg-destructive/10 shadow-[0_4px_0_#374151,0_2px_8px_#000]'}
                  drop-shadow-3xl'`}
                onClick={() => setTab('completed')}
              >
                Completed Orders
              </button>
              {/* Removed tiny dot indicator for cleaner look */}
            </div>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-6 text-center text-white bg-card border-2 border-destructive rounded-2xl custom-btn-shadow text-lg font-bold">No orders found.</div>
          )}

          <div className="flex flex-col gap-6 w-full max-w-3xl">
            {filteredOrders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="block">
                <div className="bg-card border-4 border-destructive rounded-2xl custom-btn-shadow p-6 hover:bg-destructive/10 transition flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="font-extrabold text-xl text-white mb-1 tracking-wide drop-shadow-lg">{o.items?.[0]?.title ?? "Order"}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-base transition-all duration-150
                        ${o.state === 'DELIVERED' ? 'bg-green-600 border-green-400 text-white scale-110' : o.state === 'SHIPPED' ? 'bg-blue-600 border-blue-400 text-white scale-110' : o.state === 'PAID' ? 'bg-yellow-500 border-yellow-400 text-black scale-110' : 'bg-destructive border-destructive text-white scale-110'}`}
                      >
                        {o.state === 'PENDING_PAYMENT' ? '🕒' : o.state === 'PAID' ? '💰' : o.state === 'SHIPPED' ? '🚚' : o.state === 'DELIVERED' ? '✅' : '❓'}
                      </span>
                      <span className="font-bold text-base text-white">{o.state ?? 'N/A'}</span>
                    </div>
                    {o.createdAt && (
                      <div className="text-xs text-gray-300">Date: {o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                    )}
                    {o.sellerName && <div className="text-xs text-gray-300 flex items-center gap-1"><span className="font-bold text-white">Seller:</span> {o.sellerName}</div>}
                    {o.trackingNumber && <div className="text-xs text-gray-300 flex items-center gap-1"><span className="font-bold text-white">Tracking:</span> {o.trackingNumber}</div>}
                  </div>
                  <div className="flex flex-col items-end justify-center min-w-[100px]">
                    <span className="text-2xl font-extrabold text-white drop-shadow-lg">${typeof o.subtotal === 'number' ? o.subtotal.toFixed(2) : 'N/A'}</span>
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
