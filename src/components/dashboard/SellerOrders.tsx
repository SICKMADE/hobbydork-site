"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function SellerOrders({ sellerUid }: { sellerUid: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!sellerUid || !db) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("sellerUid", "==", sellerUid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [sellerUid]);

  // Categorize orders
  const awaiting = orders.filter(o => o.status === "PAID" || o.status === "AWAITING_FULFILLMENT");
  const fulfilled = orders.filter(o => o.status === "SHIPPED" || o.status === "DELIVERED");
  const cancelled = orders.filter(o => o.status === "CANCELLED" || o.status === "REFUNDED");

  function BuyerInfo({ order }: { order: any }) {
    return (
      <div className="text-xs text-muted-foreground mt-1">
        <div>Name: {order.buyerName || "-"}</div>
        <div>Address: {order.buyerAddress || "-"}</div>
        {order.buyerUid && (
          <Link href={`/messages/${order.buyerUid}`} className="underline text-primary">Message Buyer</Link>
        )}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 p-6 max-w-5xl mx-auto">
          <Header />
          <Card className="border-2 border-black bg-card/80 shadow mb-6">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Loading orders…</div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="font-semibold mb-1">Awaiting Fulfillment</div>
                    {awaiting.length === 0 ? (
                      <div className="text-muted-foreground">No orders awaiting fulfillment.</div>
                    ) : (
                      <ul className="space-y-2">
                        {awaiting.map(order => (
                          <li key={order.id} className="border rounded p-3 bg-background/80">
                            <div className="font-bold">{order.items?.[0]?.title || order.id}</div>
                            <div>Status: {order.status}</div>
                            <BuyerInfo order={order} />
                            <Link href={`/orders/${order.id}`} className="underline text-primary text-xs">View Order</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="font-semibold mb-1">Fulfilled Orders</div>
                    {fulfilled.length === 0 ? (
                      <div className="text-muted-foreground">No fulfilled orders.</div>
                    ) : (
                      <ul className="space-y-2">
                        {fulfilled.map(order => (
                          <li key={order.id} className="border rounded p-3 bg-background/80">
                            <div className="font-bold">{order.items?.[0]?.title || order.id}</div>
                            <div>Status: {order.status}</div>
                            <BuyerInfo order={order} />
                            <Link href={`/orders/${order.id}`} className="underline text-primary text-xs">View Order</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="font-semibold mb-1">Cancelled / Refunded Orders</div>
                    {cancelled.length === 0 ? (
                      <div className="text-muted-foreground">No cancelled or refunded orders.</div>
                    ) : (
                      <ul className="space-y-2">
                        {cancelled.map(order => (
                          <li key={order.id} className="border rounded p-3 bg-background/80">
                            <div className="font-bold">{order.items?.[0]?.title || order.id}</div>
                            <div>Status: {order.status}</div>
                            <BuyerInfo order={order} />
                            <Link href={`/orders/${order.id}`} className="underline text-primary text-xs">View Order</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
