"use client";


// import BuyerSidebar from "@/components/dashboard/BuyerSidebar";
import BuyerAddressForm from "@/components/dashboard/BuyerAddressForm";
// ...existing code...
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AppLayout from "@/components/layout/AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import BuyerSidebar from "@/components/dashboard/BuyerSidebar";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import Image from 'next/image';
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
  const [blindBidderBids, setBlindBidderBids] = useState<any[]>([]);
  if (!user || !user.emailVerified || profile?.status !== "ACTIVE") {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
          <p className="mb-4">You must verify your email and have an active account to access buyer features.</p>
          <a href="/verify-email" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Verify Email</a>
        </div>
      </AppLayout>
    );
  }
  useEffect(() => {
    if (!db || !user) return;
    async function fetchBids() {
      // Find all bids by this user in all auctions
      const auctionsSnap = await getDocs(collection(db, "blindBidAuctions"));
      const auctions = auctionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let bids: any[] = [];
      let winCount = 0;
      for (const auction of auctions) {
        const bidsSnap = await getDocs(collection(db, "blindBidAuctions", auction.id, "bids"));
        bidsSnap.forEach(bidDoc => {
          const bid = bidDoc.data();
          // Ensure auction has correct type
          const auctionWithStatus = auction as { id: string; status?: string; winnerUid?: string };
          if (user && bid.bidderUid === user.uid) {
            const isWinner = auctionWithStatus.status === 'CLOSED' && auctionWithStatus.winnerUid === user.uid;
            if (isWinner) winCount++;
            bids.push({ ...bid, id: bidDoc.id, auction: auctionWithStatus, isWinner });
          }
        });
      }
      setBlindBidderBids(bids);
      setWinRate(bids.length > 0 ? (winCount / bids.length) : 0);
    }
    fetchBids();
  }, [db, user]);

  const displayName = profile?.displayName ?? (user?.email ?? "Collector");
  // Always resolve avatar, fallback to default if missing
  const { resolveAvatarUrl } = require("@/lib/default-avatar");
  const avatarUrl = resolveAvatarUrl(profile?.avatar, profile?.uid);

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

  const [winRate, setWinRate] = useState(0);
  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <BuyerSidebar />
          <main className="flex-1 p-6 max-w-6xl mx-auto">
            {/* Buyer Overview Header */}
            <div className="flex flex-col items-center mb-8">
              <Image
                src="/BUYERDASH.PNG"
                alt="Buyer Dashboard"
                width={312}
                height={112}
                className="w-78 h-28 object-contain mb-2 drop-shadow-lg"
                priority
              />
            </div>
            {/* Buyer Stats Card */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="border-2 border-black bg-card/80 rounded-lg p-6 flex flex-col items-center">
                <div className="text-sm text-white font-semibold">Orders</div>
                <div className="text-3xl font-extrabold text-white drop-shadow-lg">{orderCount}</div>
                <Link href="/orders" className="text-xs text-blue-400 underline mt-2">View Orders</Link>
              </div>
              <div className="border-2 border-black bg-card/80 rounded-lg p-6 flex flex-col items-center">
                <div className="text-sm text-white font-semibold">Watchlist</div>
                <div className="text-3xl font-extrabold text-white drop-shadow-lg">{watchlistCount}</div>
                <Link href="/watchlist" className="text-xs text-blue-400 underline mt-2">View Watchlist</Link>
              </div>
              <div className="border-2 border-black bg-card/80 rounded-lg p-6 flex flex-col items-center">
                <div className="text-sm text-white font-semibold">Unread Messages</div>
                <div className="text-3xl font-extrabold text-white drop-shadow-lg">{unreadMessages}</div>
                <Link href="/messages" className="text-xs text-blue-400 underline mt-2">Go to Messages</Link>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <div className="border-2 border-black bg-card/80 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:bg-primary/10 transition">
                    <div className="text-sm text-white font-semibold">Shipping Address</div>
                    <div className="text-3xl font-extrabold text-white drop-shadow-lg">Edit</div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogTitle>Edit Shipping Address</DialogTitle>
                  <BuyerAddressForm />
                </DialogContent>
              </Dialog>
            </div>
            {/* Recent Orders Card */}
            <div className="mb-6">
              <div className="font-semibold mb-2">Recent Orders</div>
              {orders.length === 0 ? (
                <div className="text-muted-foreground">No orders yet.</div>
              ) : (
                <ul className="space-y-2">
                  {orders.slice(0, 5).map((order: any) => (
                    <li key={order.id} className="border rounded p-3 bg-background/80 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-bold">Order #{order.id}</div>
                        <div>Status: {order.status || 'N/A'}</div>
                        <div>Date: {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="mt-2 md:mt-0 md:ml-4 flex gap-2">
                        <Link href={`/orders/${order.id}`} className="text-primary underline text-xs font-bold">View Order</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Blind Bidder Bids Section */}
            <div className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Blind Bidder Bids</h2>
              <div className="mb-2 text-xs">Win Rate: <span className="font-bold">{(winRate * 100).toFixed(1)}%</span></div>
              {blindBidderBids.length === 0 ? (
                <div className="text-muted-foreground">No Blind Bidder bids yet.</div>
              ) : (
                <ul className="space-y-2">
                  {blindBidderBids
                    .slice()
                    .sort((a, b) => {
                      if (a.auction.status === b.auction.status) {
                        const aEnd = a.auction.endsAt?.seconds ? a.auction.endsAt.seconds : (a.auction.endsAt ? new Date(a.auction.endsAt).getTime() / 1000 : 0);
                        const bEnd = b.auction.endsAt?.seconds ? b.auction.endsAt.seconds : (b.auction.endsAt ? new Date(b.auction.endsAt).getTime() / 1000 : 0);
                        return bEnd - aEnd;
                      }
                      return a.auction.status === 'OPEN' ? -1 : 1;
                    })
                    .map(bid => (
                    <li key={bid.id} className="border border-primary rounded-lg bg-background/80 p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold text-base">{bid.auction.title}</div>
                        <div className="text-xs text-muted-foreground">Ends: {bid.auction.endsAt?.seconds ? new Date(bid.auction.endsAt.seconds * 1000).toLocaleString() : bid.auction.endsAt ? new Date(bid.auction.endsAt).toLocaleString() : 'N/A'}</div>
                        <div className="text-xs flex items-center gap-2">Status: <span className={`font-bold px-2 py-1 rounded ${bid.auction.status === 'CLOSED' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{bid.auction.status}</span></div>
                        <div className="text-xs">Your Bid: <span className="font-bold">${bid.amount.toFixed(2)}</span></div>
                        {bid.auction.status === 'CLOSED' && bid.auction.winnerUid && (
                          <div className={`text-xs font-bold px-2 py-1 rounded ${bid.isWinner ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{bid.isWinner ? 'You won!' : 'Not selected'}</div>
                        )}
                      </div>
                      <div className="mt-2 md:mt-0 md:ml-4 flex gap-2">
                        <Link href={`/blind-bidder/${bid.auction.id}`} className="text-primary underline text-xs font-bold">View Auction</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
