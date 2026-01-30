"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { getBronzeBadgeClass } from './bronzeBadgeUtil';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Image from "next/image";
import Header from "@/components/layout/Header";
import "@/styles/grid-bg-dark.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { sendNotification } from "@/lib/notify";
import { useToast } from "@/hooks/use-toast";

export default function SellerOrders({ sellerUid }: { sellerUid: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [modalOrder, setModalOrder] = useState<any>(null);
  const { toast } = useToast();
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  // Fetch seller profile for tier badge
  useEffect(() => {
    if (!sellerUid || !db) return;
    (async () => {
      const ref = doc(db, 'users', sellerUid);
      const snap = await getDoc(ref);
      if (snap.exists()) setSellerProfile(snap.data());
    })();
  }, [sellerUid]);

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

  // Tab filtering
  const activeStates = ["PENDING_PAYMENT", "PAID", "SHIPPED", "AWAITING_FULFILLMENT"];
  const completedStates = ["DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"];
  const filteredOrders = tab === 'active'
    ? orders.filter((o) => activeStates.includes(o.status))
    : orders.filter((o) => completedStates.includes(o.status));

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

  {/* Shipment Progress Bar with Moving Truck */}
  function ShipmentProgress({ order }: { order: any }) {
    return (
      <div className="relative flex items-center gap-2 mb-1 h-6">
        {/* Progress dots and bars */}
        <div className={`w-3 h-3 rounded-full ${order.status === 'PAID' || order.status === 'AWAITING_FULFILLMENT' ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
        <div className={`h-1 w-8 ${order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
        <div className={`w-3 h-3 rounded-full ${order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
        <div className={`h-1 w-8 ${order.status === 'DELIVERED' ? 'bg-green-400' : 'bg-gray-200'}`}></div>
        <div className={`w-3 h-3 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
        {/* Moving truck icon */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ${
            order.status === 'PAID' || order.status === 'AWAITING_FULFILLMENT'
              ? 'truck-left-paid'
              : order.status === 'SHIPPED'
              ? 'truck-left-shipped'
              : order.status === 'DELIVERED'
              ? 'truck-left-delivered'
              : 'truck-left-paid'
          }`}
        >
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5" width="12" height="6" rx="2" fill="#4B5563" />
            <rect x="14" y="7" width="6" height="4" rx="1" fill="#9CA3AF" />
            <circle cx="6" cy="13" r="2" fill="#111827" />
            <circle cx="18" cy="13" r="2" fill="#111827" />
          </svg>
        </div>
        <span className="ml-2 text-xs">
          {order.status === 'PAID' || order.status === 'AWAITING_FULFILLMENT' ? 'Paid' : order.status === 'SHIPPED' ? 'Shipped' : order.status === 'DELIVERED' ? 'Delivered' : order.status}
        </span>
        {order.status === 'PAID' || order.status === 'AWAITING_FULFILLMENT' ? (
          order.createdAt && Date.now() - (order.createdAt.seconds ? order.createdAt.seconds * 1000 : new Date(order.createdAt).getTime()) > 2 * 24 * 60 * 60 * 1000 ? (
            <span className="ml-2 px-2 py-1 text-xs bg-red-100 border border-red-400 text-red-700 rounded font-bold">Overdue</span>
          ) : null
        ) : null}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 p-6 max-w-5xl mx-auto bg-grid-dark">
          <Header />
          <Image
            src="/MYSALES.png"
            alt="My Sales"
            width={800}
            height={128}
            className="w-full max-w-2xl h-32 object-contain mx-auto mb-6 drop-shadow-lg"
            priority
          />
          {/* Seller Tier Badge Overview */}
          {sellerProfile && (
            <div className="mb-4 flex items-center gap-3">
              <span className="font-bold text-lg">Seller Tier:</span>
              {(() => {
                const tier = (sellerProfile.sellerTier || 'BRONZE').toUpperCase();
                let style = {};
                let className = 'px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border shadow-inner';
                if (tier === 'GOLD') {
                  style = {
                    background: 'linear-gradient(90deg, #fffbe6 0%, #ffe066 40%, #ffd700 60%, #fffbe6 100%)',
                    color: '#a67c00',
                    borderColor: '#ffd700',
                    boxShadow: '0 1px 4px 0 #ffe06688, 0 0.5px 0 #fff inset',
                  };
                  className += ' border-yellow-400';
                } else if (tier === 'SILVER') {
                  style = {
                    background: 'linear-gradient(90deg, #f8f9fa 0%, #d1d5db 40%, #b0b4ba 60%, #f8f9fa 100%)',
                    color: '#555',
                    borderColor: '#b0b4ba',
                    boxShadow: '0 1px 4px 0 #b0b4ba88, 0 0.5px 0 #fff inset',
                  };
                  className += ' border-gray-400';
                } else {
                  style = {};
                  className += ' border-orange-400 ' + getBronzeBadgeClass();
                }
                return (
                  <span className={className}>{tier} SELLER</span>
                );
              })()}
            </div>
          )}
          {/* Tabs */}
          <div className="flex flex-row items-center gap-4 mb-8">
            <button
              className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-150 ${tab === 'active' ? 'bg-blue-600 text-white' : 'bg-background text-blue-200 border border-blue-400'}`}
              onClick={() => setTab('active')}
            >
              Active Sales
            </button>
            <button
              className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-150 ${tab === 'completed' ? 'bg-blue-600 text-white' : 'bg-background text-blue-200 border border-blue-400'}`}
              onClick={() => setTab('completed')}
            >
              Completed Sales
            </button>
          </div>
          {/* Orders List */}
          {loading ? (
            <div className="text-muted-foreground">Loading orders…</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-white bg-grid border-2 border-blue-400 rounded-2xl custom-btn-shadow text-lg font-bold">No sales found.</div>
          ) : (
            <div className="flex flex-col gap-6 w-full max-w-3xl">
              {filteredOrders.map((order: any) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <div className="bg-card border-4 border-blue-400 rounded-2xl custom-btn-shadow p-6 hover:bg-blue-600/10 transition flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="font-extrabold text-xl text-white mb-1 tracking-wide drop-shadow-lg">{order.items?.[0]?.title ?? "Order"}</div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-base transition-all duration-150
                          ${order.status === 'COMPLETED' ? 'bg-green-600 border-green-400 text-white scale-110' : order.status === 'SHIPPED' ? 'bg-blue-600 border-blue-400 text-white scale-110' : order.status === 'PAID' ? 'bg-yellow-500 border-yellow-400 text-black scale-110' : order.status === 'PENDING_PAYMENT' ? 'bg-blue-400 border-blue-400 text-white scale-110' : 'bg-red-600 border-red-400 text-white scale-110'}`}
                        >
                          {order.status === 'PENDING_PAYMENT' ? '🕒' : order.status === 'PAID' ? '💰' : order.status === 'SHIPPED' ? '🚚' : order.status === 'COMPLETED' ? '✅' : order.status === 'CANCELLED' ? '❌' : '❓'}
                        </span>
                        <span className="text-base font-bold text-white">{order.status}</span>
                      </div>
                      <div className="text-sm text-blue-200">Date: {order.createdAt ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()) : 'N/A'}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between min-w-[100px]">
                      <div className="text-2xl font-extrabold text-white">${order.items?.[0]?.price?.toFixed(2) ?? order.subtotal?.toFixed(2) ?? '0.00'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
