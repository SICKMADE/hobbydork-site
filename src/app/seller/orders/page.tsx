"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import { db } from "@/firebase/client-provider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SellerOrdersPage() {
  const { user, profile, loading } = require("@/hooks/use-auth").useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile?.isSeller || profile?.status !== "ACTIVE" || !db) return;
    const q = query(
      collection(db!, "orders"),
      where("sellerUid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, profile]);

  if (loading || !user || !profile?.isSeller || profile?.status !== "ACTIVE") {
    return (
      <AppLayout sidebarComponent={<SellerSidebar />}>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="p-8 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Seller Access Required</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/become-seller" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Become a Seller</Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout sidebarComponent={<SellerSidebar />}>
      <main className="flex-1 p-6 max-w-6xl mx-auto bg-grid-dark">
        <Header />
        <div className="flex flex-col items-center mb-8">
          <img
            src="/sales.png"
            alt="My Sales"
            width={412}
            height={212}
            className="w-78 h-28 object-contain mb-2 drop-shadow-lg"
            loading="eager"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-extrabold">{profile?.displayName || 'Seller'}</span>
            {(() => {
              const tier = (profile?.sellerTier || 'BRONZE').toUpperCase();
              let className = 'ml-1 px-2 py-0.5 rounded-full text-[12px] font-semibold tracking-wider uppercase border shadow-inner';
              if (tier === 'GOLD') {
                className += ' border-yellow-400 seller-tier-gold';
              } else if (tier === 'SILVER') {
                className += ' border-gray-400 seller-tier-silver';
              } else {
                className += ' border-orange-400 seller-tier-bronze';
              }
              return <span className={className}>{tier} SELLER</span>;
            })()}
          </div>
        </div>
        <Card className="border-2 border-black bg-card/80 shadow mb-8">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center text-muted-foreground">No orders found.</div>
            ) : (
              <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
                {orders.map((o) => (
                  <Link key={o.id} href={`/orders/${o.id}`} className="block">
                    <div className="bg-card border-4 border-primary rounded-2xl p-6 hover:bg-primary/10 transition flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="font-extrabold text-xl mb-1 tracking-wide">{o.items?.[0]?.title ?? "Order"}</div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-8 h-8 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-base transition-all duration-150 bg-primary text-white">
                            {o.state === 'DELIVERED' ? '✅' : o.state === 'SHIPPED' ? '🚚' : o.state === 'PAID' ? '💰' : o.state === 'PENDING_PAYMENT' ? '🕒' : '❓'}
                          </span>
                          <span className="font-bold text-base">{o.state ?? 'N/A'}</span>
                        </div>
                        {o.createdAt && (
                          <div className="text-xs text-gray-500">Date: {o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                        )}
                        {o.buyerName && <div className="text-xs text-gray-500 flex items-center gap-1"><span className="font-bold">Buyer:</span> {o.buyerName}</div>}
                        {o.trackingNumber && <div className="text-xs text-gray-500 flex items-center gap-1"><span className="font-bold">Tracking:</span> {o.trackingNumber}</div>}
                      </div>
                      <div className="flex flex-col items-end justify-center min-w-[100px]">
                        <span className="text-2xl font-extrabold">${typeof o.subtotal === 'number' ? o.subtotal.toFixed(2) : 'N/A'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
