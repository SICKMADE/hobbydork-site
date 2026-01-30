"use client";


import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/firebase/client-init";
import AppLayout from "@/components/layout/AppLayout";
import BuyerSidebar from "@/components/dashboard/BuyerSidebar";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import BuyerAddressForm from "@/components/dashboard/BuyerAddressForm";


// Local UI helpers
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-black bg-card/80 shadow rounded-2xl w-full flex-1 flex flex-col min-h-[420px] mb-8">
      <div className="border-b border-border px-6 pt-6 pb-3">
        <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
      </div>
      <div className="p-6 flex flex-col flex-1 justify-between">{children}</div>
    </div>
  );
}

function OrderList({ orders, trackingMap }: { orders: any[]; trackingMap: Record<string, any> }) {
  if (!orders || orders.length === 0) return <span className="text-muted-foreground">No recent orders</span>;
  return (
    <ul className="text-base text-card-foreground space-y-1">
      {orders.slice(0, 3).map((order) => (
        <li key={order.id} className="flex flex-col">
          <span className="font-semibold">Order #{order.id}</span>
          <span className="text-xs text-muted-foreground">{order.status || 'N/A'}{order.createdAt?.seconds ? ` • ${new Date(order.createdAt.seconds * 1000).toLocaleDateString()}` : ''}</span>
        </li>
      ))}
    </ul>
  );
}

function BidList({ bids }: { bids: any[] }) {
  if (!bids || bids.length === 0) return <span className="text-muted-foreground">No bids</span>;
  return (
    <ul className="text-base text-card-foreground space-y-1">
      {bids.slice(0, 3).map((bid) => (
        <li key={bid.id} className="flex flex-col">
          <span className="font-semibold">Bid #{bid.id}</span>
          <span className="text-xs text-muted-foreground">{bid.status || 'N/A'}{bid.createdAt?.seconds ? ` • ${new Date(bid.createdAt.seconds * 1000).toLocaleDateString()}` : ''}</span>
        </li>
      ))}
    </ul>
  );
}


export default function BuyerDashboard() {
  const { user, profile, loading } = useAuth(); // <-- user is destructured here
  const { firestore: db } = getFirebase();
  const [orderCount, setOrderCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [blindBidderBids, setBlindBidderBids] = useState<any[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, any>>({});
  const trackingAbortControllers = useRef<Record<string, AbortController>>({});
  const [winRate, setWinRate] = useState(0);
  const [modalOrder, setModalOrder] = useState<any | null>(null);

  // Early exit for unverified/inactive users
  if (!user || !user.emailVerified || profile?.status !== "ACTIVE") {
    return (
      <AppLayout sidebarComponent={<BuyerSidebar />}>
        <div className="max-w-xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
          <p className="mb-4">You must verify your email and have an active account to access buyer features.</p>
          <a href="/verify-email" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Verify Email</a>
        </div>
      </AppLayout>
    );
  }
  // Main dashboard content for active users
  return (
    <AppLayout sidebarComponent={<BuyerSidebar />}>
      {/* Full-width header with search bar style */}
      <header className="rounded-2xl border bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6 sm:p-7 shadow-xl m-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/BUYERDASH.png"
              alt="Buyer Dashboard"
              width={256}
              height={56}
              className="w-64 h-14 object-contain drop-shadow-lg"
              priority
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-400/80">
                HobbyDork Buyer Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl text-white">
                Welcome, {user?.displayName || user?.email || 'Collector'}!
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <button className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Edit Shipping Address</button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogTitle>Edit Shipping Address</DialogTitle>
                <BuyerAddressForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      {/* Overview - Seller Dashboard Style for Buyers, Full-width Stacked Cards */}
      <SectionCard title="Account & Orders">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg bg-muted p-4 flex flex-col items-center min-h-[80px] w-full">
            <div className="text-sm text-muted-foreground">Active Orders</div>
            <div className="text-2xl font-bold">{orderCount > 0 ? orderCount : '0'}</div>
          </div>
          <div className="rounded-lg bg-muted p-4 flex flex-col items-center min-h-[80px] w-full">
            <div className="text-sm text-muted-foreground">Watchlist Items</div>
            <div className="text-2xl font-bold">{watchlistCount > 0 ? watchlistCount : '0'}</div>
          </div>
        </div>
        <div className="font-semibold mb-2">Recent Orders</div>
        <OrderList orders={orders} trackingMap={trackingMap} />
        <div className="flex justify-end mt-6">
          <a href="/orders" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Go to Orders</a>
        </div>
      </SectionCard>
      <SectionCard title="Buyer Performance">
        <div className="border border-border rounded-lg bg-background/80 p-4 mb-2">
          <div className="font-bold text-lg mb-2">Your Buyer Rating</div>
          {typeof profile?.ratingAverage === 'number' && Number(profile.ratingCount) > 0 ? (
            <span className="text-yellow-400 font-bold">{Number(profile.ratingAverage).toFixed(2)} / 5 ({Number(profile.ratingCount)} reviews)</span>
          ) : (
            <span className="text-muted-foreground text-sm">No reviews yet</span>
          )}
        </div>
        <div className="border border-border rounded-lg bg-background/80 p-4">
          <div className="font-bold text-lg mb-2">Tips for Buyers</div>
          <ul className="list-disc pl-5 text-base text-muted-foreground space-y-1">
            <li>Check seller ratings and reviews before purchasing.</li>
            <li>Use your watchlist to track items you want.</li>
            <li>Message sellers for more info or bundle deals.</li>
            <li>Mark items as received to complete your orders.</li>
            <li>Report suspicious activity to support.</li>
          </ul>
        </div>
      </SectionCard>
      <SectionCard title="Recent Orders">
        <OrderList orders={orders} trackingMap={trackingMap} />
      </SectionCard>
      <SectionCard title="Blind Bidder Bids">
        <div className="mb-2 text-xs">Win Rate: <span className="font-bold">{(winRate * 100).toFixed(1)}%</span></div>
        <BidList bids={blindBidderBids} />
      </SectionCard>
    </AppLayout>
  );
}


