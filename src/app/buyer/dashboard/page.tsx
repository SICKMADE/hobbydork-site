"use client";


import BuyerSidebar from "@/components/dashboard/BuyerSidebar";
import BuyerAddressForm from "@/components/dashboard/BuyerAddressForm";
// ...existing code...
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { getFirebase } from "@/firebase/client-init";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export default function BuyerDashboard() {
  const { user, profile, loading } = useAuth();
  const { firestore: db } = getFirebase();
  const [orderCount, setOrderCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  if (loading) return null;
  if (!user) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="bg-background/90 p-8 rounded-2xl custom-btn-shadow border-4 border-primary text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">Sign in to view your dashboard</h1>
          <Link href="/login" className="comic-button px-6 py-2 rounded custom-btn-shadow text-white bg-destructive border-2 border-primary hover:bg-primary hover:text-black transition">Sign In</Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName ?? user.email ?? "Collector";
  // Always resolve avatar, fallback to default if missing
  const { resolveAvatarUrl } = require("@/lib/default-avatar");
  const avatarUrl = resolveAvatarUrl(profile?.avatar, profile?.uid);

  const { SidebarProvider } = require("@/components/ui/sidebar");
  // Fetch stats and orders
  useEffect(() => {
    if (!db || !user) return;
    // Orders
    const ordersQ = query(collection(db, "orders"), where("buyerUid", "==", user.uid));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setOrderCount(snap.size);
    });
    // Watchlist
    const watchlistQ = query(collection(db, `users/${user.uid}/watchlist`));
    const unsubWatchlist = onSnapshot(watchlistQ, (snap) => {
      setWatchlistCount(snap.size);
    });
    // Unread messages (dummy for now)
    setUnreadMessages(0);
    return () => {
      unsubOrders();
      unsubWatchlist();
    };
  }, [db, user]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <BuyerSidebar />
        <main className="flex-1 flex items-center justify-center p-2 bg-grid bg-[length:150px_150px] bg-center">
          <div className="max-w-5xl w-full flex flex-col gap-8 rounded-2xl border-2 border-destructive bg-background/95 p-8 md:p-12">
            {/* Dashboard PNG header at very top */}
            <div className="flex flex-col items-center mb-8">
              <img src="/BUYERDASH.PNG" alt="Buyer Dashboard" className="w-78 h-28 object-contain mb-2 drop-shadow-lg" />
            </div>
            {/* Stats grid directly under PNG */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {/* Orders */}
                  <Link href="/orders" className="contents">
                    <div className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] rounded-lg cursor-pointer hover:bg-primary/10 transition flex flex-col items-center justify-center p-4">
                      <div className="text-sm font-semibold">Orders</div>
                      <div className="text-2xl font-bold">{orderCount}</div>
                    </div>
                  </Link>
                  {/* Watchlist */}
                  <Link href="/watchlist" className="contents">
                    <div className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] rounded-lg cursor-pointer hover:bg-primary/10 transition flex flex-col items-center justify-center p-4">
                      <div className="text-sm font-semibold">Watchlist</div>
                      <div className="text-2xl font-bold">{watchlistCount}</div>
                    </div>
                  </Link>
                  {/* Unread */}
                  <Link href="/messages" className="contents">
                    <div className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] rounded-lg cursor-pointer hover:bg-primary/10 transition flex flex-col items-center justify-center p-4">
                      <div className="text-sm font-semibold">Unread</div>
                      <div className="text-2xl font-bold">{unreadMessages}</div>
                    </div>
                  </Link>
                  {/* Address Shortcut */}
                  <button type="button" className="contents">
                    <div className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] rounded-lg cursor-pointer hover:bg-primary/10 transition flex flex-col items-center justify-center p-4">
                      <div className="text-sm font-semibold">Shipping Address</div>
                      <div className="text-2xl font-bold">Edit</div>
                    </div>
                  </button>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogTitle>Edit Shipping Address</DialogTitle>
                <BuyerAddressForm />
              </DialogContent>
            </Dialog>
            {/* Remove old stats grid, replaced by shortcut grid above */}
            {/* Recent Orders - styled card */}
            <div className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] rounded-2xl p-6">
              {/* Removed header text, only PNG at top */}
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-muted-foreground text-xs">
                  <div className="text-2xl mb-1">🛒</div>
                  <div>No orders yet.</div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id} className="border border-primary rounded-lg bg-background/80 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-base text-white">{o.items?.[0]?.title || o.listingTitle || "Order"}</div>
                        <div className="text-xs text-white">{o.createdAt && o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${o.state === 'DELIVERED' ? 'bg-green-600 text-white' : o.state === 'SHIPPED' ? 'bg-blue-600 text-white' : o.state === 'PAID' ? 'bg-yellow-500 text-black' : 'bg-destructive text-white'}`}>{o.state || o.status || "N/A"}</span>
                        <span className="text-xs font-bold text-green-400 mt-1">${typeof o.subtotal === 'number' ? o.subtotal.toFixed(2) : o.amount}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 text-right">
                <Link href="/orders" className="text-primary underline text-xs font-bold">
                  View all orders
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
