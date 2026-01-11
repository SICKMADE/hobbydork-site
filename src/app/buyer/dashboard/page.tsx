"use client";


import BuyerSidebar from "@/components/dashboard/BuyerSidebar";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";

export default function BuyerDashboard() {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="bg-background/90 p-8 rounded-2xl shadow-xl border border-red-500 text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h1>
          <Link href="/login" className="comic-button px-6 py-2 rounded text-white bg-primary hover:bg-primary/90 transition">Sign In</Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName ?? user.email ?? "Collector";
  const avatarUrl = profile?.avatar || undefined;

  // Real stats
  const [orderCount, setOrderCount] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user || !profile || profile.status !== "ACTIVE" || !db) return;

    // Orders (list and count)
    const ordersQ = query(
      collection(db, "orders"),
      where("buyerUid", "==", user.uid)
    );
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      setOrderCount(snap.size);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Watchlist
    const watchlistQ = collection(db, `users/${profile.uid}/watchlist`);
    getDocs(watchlistQ).then((snap) => {
      setWatchlistCount(snap.size);
    });

    // Unread messages (conversations with unread for this user)
    const conversationsQ = query(
      collection(db, "conversations"),
      where("participantUids", "array-contains", user.uid)
    );
    const unsubConvos = onSnapshot(conversationsQ, (snap) => {
      let unread = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        // Assume a field like unreadBy: [uid, ...]
        if (Array.isArray(data.unreadBy) && data.unreadBy.includes(user.uid)) {
          unread += 1;
        }
      });
      setUnreadMessages(unread);
    });

    return () => {
      unsubOrders();
      unsubConvos();
    };
  }, [user, profile]);

  // ...existing code...

  return (
    <div className="flex min-h-screen bg-background">
      <BuyerSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center">
        <div className="max-w-3xl w-full flex flex-col gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-8 md:p-12">
          {/* Profile summary */}
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-primary/50">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-extrabold text-red-400">Welcome, {displayName}</h1>
              <p className="text-sm text-gray-300">Buyer Dashboard</p>
            </div>
          </div>

          {/* ...existing code... */}

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center border-2 border-gray-700 shadow">
              <span className="text-2xl font-bold text-white">{orderCount}</span>
              <span className="text-xs text-gray-300 mt-1">Orders</span>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center border-2 border-gray-700 shadow">
              <span className="text-2xl font-bold text-white">{watchlistCount}</span>
              <span className="text-xs text-gray-300 mt-1">Watchlist</span>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center border-2 border-gray-700 shadow">
              <span className="text-2xl font-bold text-white">{unreadMessages}</span>
              <span className="text-xs text-gray-300 mt-1">Unread Messages</span>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Recent Orders</h2>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                <div className="text-3xl mb-2">🛒</div>
                <div>No orders yet.</div>
                <div className="mt-2 text-xs">When you place an order, it will show up here.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <Link key={o.id} href={`/orders/${o.id}`} className="block">
                    <div className="p-4 border rounded bg-gray-800 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:bg-gray-700 transition">
                      <div>
                        <div className="font-semibold">{o.listingTitle || "Order"}</div>
                        <div className="text-xs text-gray-400">Status: {o.status || ""}</div>
                      </div>
                      <div className="text-sm font-bold">${typeof o.amount === 'number' ? o.amount.toFixed(2) : o.amount}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 text-right">
              <Link href="/orders" className="text-primary underline text-sm">View all orders</Link>
            </div>
          </div>

          {/* Main actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <Link href="/watchlist" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
              <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Watchlist</span>
              <span className="text-sm text-gray-300">See items you’re watching.</span>
            </Link>
            <Link href="/messages" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
              <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Messages</span>
              <span className="text-sm text-gray-300">Check your messages and conversations.</span>
            </Link>
            <Link href="/profile" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
              <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Profile</span>
              <span className="text-sm text-gray-300">Edit your profile and settings.</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
