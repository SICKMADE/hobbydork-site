"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AppLayout from "@/components/layout/AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import "./order-progress-bar.css";
const BuyerSidebar = dynamic(() => import("@/components/dashboard/BuyerSidebar"), { ssr: false });
import Image from 'next/image';
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
// Remove usePromise import

type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";


export default function OrderDetail({ params }: any) {
  // All hooks must be at the top level, before any return or conditional
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);

  // Next.js 15+: params is a Promise, unwrap with React.use()
  // See: https://nextjs.org/docs/messages/migrating-params-promise
  const { orderId } = typeof params?.then === 'function' ? React.use(params) : params;

  useEffect(() => {
    // Strict Firestore read gate
    const canReadFirestore = !!user;
    if (!canReadFirestore) return;
    if (!db) return;
    // Only fetch needed fields for order
    const ref = doc(db!, "orders", orderId);
    const unsub = onSnapshot(ref, {
      includeMetadataChanges: true
    }, (snap) => {
      if (snap.exists()) {
        // Only select needed fields
        const data = snap.data();
        setOrder({
          id: snap.id,
          buyerUid: data.buyerUid,
          sellerUid: data.sellerUid,
          state: data.state,
          status: data.status,
          subtotal: data.subtotal,
          shippingAddress: data.shippingAddress,
          // Add other essential fields as needed
        });
      }
    });
    return () => unsub();
  }, [orderId, user]);

  // Review reminder notification (if not reviewed after delivery)
  useEffect(() => {
    if (!order || !order.buyerUid) return;
    if ((order.status || order.state) === "DELIVERED" && !order.reviewId) {
      // Only send once per delivery (could add a flag in Firestore for production)
      const timer = setTimeout(async () => {
        const { sendNotification } = await import("@/lib/notify");
        await sendNotification(order.buyerUid, {
          type: 'ORDER',
          title: 'Please review your order',
          body: `Please leave a review for your recent order (${order.items?.[0]?.title ?? order.id})!`,
          relatedId: order.id,
        });
      }, 10000); // 10s after delivery for demo; use 24h+ in production
      return () => clearTimeout(timer);
    }
  }, [order]);

  if (!order || !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <BuyerSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-6">Loading…</div>
        </main>
      </div>
    );
  }

  const isBuyer = order.buyerUid === user.uid;
  const isSeller = order.sellerUid === user.uid;

  /* ---------------- STRIPE PAY NOW ---------------- */

  async function payNow() {
    try {
      const app = typeof window !== 'undefined' ? (await import('firebase/app')).getApp() : undefined;
      const fn = httpsCallable(getFunctions(app, 'us-central1'), "createCheckoutSession");

      const amountCents = Math.round(order.subtotal * 100);

      // eslint-disable-next-line no-console
      console.info('[checkout] payNow calling createCheckoutSession', { orderId: order.id });

      const res: any = await fn({
        orderId: order.id,
        listingTitle: order.items?.[0]?.title ?? "Order",
        amountCents,
        appBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
      });

      const url = res?.data?.url;
      if (!url) {
        toast({
          title: "Stripe checkout error",
          description: "No payment URL was returned. Please try again or contact support.",
          variant: "destructive",
          action: (
            <ToastAction altText="Contact Support" asChild>
              <a href="/help" target="_blank" rel="noopener">Contact Support</a>
            </ToastAction>
          ),
        });
        throw new Error("Stripe checkout URL missing");
      }

      toast({
        title: "Redirecting to Stripe",
        description: "You will be redirected to Stripe to complete your payment.",
        variant: "default",
      });
      window.location.href = url;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[checkout] payNow failed', err);
      toast({
        title: "Payment Error",
        description: `${err?.message ?? "An unexpected error occurred. Please try again or contact support."}`,
        variant: "destructive",
        action: (
          <ToastAction altText="Contact Support" asChild>
            <a href="/help" target="_blank" rel="noopener">Contact Support</a>
          </ToastAction>
        ),
      });
    }
  }

  /* ---------------- SELLER ACTIONS ---------------- */

  async function markShipped(trackingNumber: string, carrier: string) {
    if (!db) return;
    try {
      await updateDoc(doc(db!, "orders", orderId), {
        state: "SHIPPED",
        trackingNumber,
        carrier,
        shippedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Order marked as shipped",
        description: `Tracking number ${trackingNumber} (${carrier}) sent to buyer.`,
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error marking as shipped",
        description: `${err?.message ?? "Could not update order. Please try again."}`,
        variant: "destructive",
        action: (
          <ToastAction altText="Contact Support" asChild>
            <a href="/help" target="_blank" rel="noopener">Contact Support</a>
          </ToastAction>
        ),
      });
    }
  }

  /* ---------------- BUYER ACTIONS ---------------- */

  async function confirmDelivered() {
    if (!db) return;
    try {
      await updateDoc(doc(db!, "orders", orderId), {
        state: "DELIVERED",
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Notify buyer (self) that order is delivered
      if (order && order.buyerUid) {
        const { sendNotification } = await import("@/lib/notify");
        await sendNotification(order.buyerUid, {
          type: 'ORDER',
          title: 'Order marked delivered',
          body: `Order ${order.items?.[0]?.title ?? order.id} was marked delivered. Please leave a review for your seller!`,
          relatedId: order.id,
        });
      }
      toast({
        title: "Order confirmed delivered",
        description: "Thank you for confirming delivery! You may now leave feedback for your seller.",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error confirming delivery",
        description: `${err?.message ?? "Could not update order. Please try again."}`,
        variant: "destructive",
        action: (
          <ToastAction altText="Contact Support" asChild>
            <a href="/help" target="_blank" rel="noopener">Contact Support</a>
          </ToastAction>
        ),
      });
    }
  }

  // (duplicate useEffect removed)
  // Progress bar logic
  // Use either state or status for progress
  const effectiveState = order.status || order.state;
  const statusSteps = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED"];
  const currentStep = statusSteps.indexOf(effectiveState);
  const progressPercent = ((currentStep + 1) / statusSteps.length) * 100;

  // Timeline/history logic (mocked for now, can be replaced with real timestamps)
  const timeline = [
    order.createdAt && { label: "Order Placed", date: new Date(order.createdAt.seconds * 1000).toLocaleString() },
    order.paidAt && { label: "Paid", date: new Date(order.paidAt.seconds * 1000).toLocaleString() },
    order.shippedAt && { label: "Shipped", date: new Date(order.shippedAt.seconds * 1000).toLocaleString() },
    order.deliveredAt && { label: "Delivered", date: new Date(order.deliveredAt.seconds * 1000).toLocaleString() },
  ].filter(Boolean);

  // Estimated delivery logic
  let estDelivery = null;
  if (order.shippedAt?.seconds) {
    // Default to 3 days for all carriers, or adjust as needed for Shippo
    let estDays = 3;
    estDelivery = new Date(order.shippedAt.seconds * 1000 + estDays * 86400000);
  }

  // Contact seller button
  const contactSellerBtn = (
    <a
      href={`/messages?uid=${order.sellerUid}`}
      className="comic-button bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base px-6 py-3 font-bold rounded-full shadow border-2 border-blue-800 mt-2 w-full xs:w-auto text-center"
    >
      Contact Seller
    </a>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <BuyerSidebar />
        <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-2 xs:p-4 bg-transparent">
          <div className="w-full max-w-3xl border-2 border-destructive bg-card/80 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center gap-4 p-4 md:p-6 border-b border-gray-700 w-full">
              <Image
                src="/order.png"
                alt="Order"
                width={800}
                height={160}
                className="w-full max-w-full h-40 mb-4 object-contain"
                priority
              />
              {/* Order Progress Bar */}
              <div className="w-full flex flex-col items-center mb-4">
                <div className="w-full xs:w-2/3 md:w-1/2 h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-3 bg-yellow-400 rounded-full transition-all duration-300 order-progress-bar`}
                    data-progress={progressPercent}
                  ></div>
                </div>
                {/* Nintendo-style round buttons for steps */}
                <div className="w-full flex justify-center mb-6">
                  <ol className="flex items-center space-x-6 text-xs">
                    {/* ...existing code for round buttons... */}
                    <li className="flex flex-col items-center">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-lg transition-all duration-150
                        ${order.state === 'PENDING_PAYMENT' ? 'bg-destructive border-destructive text-white scale-110' : 'bg-gray-700 border-gray-500 text-gray-300'}
                      `}>
                        1
                      </span>
                      <span className="mt-1 font-semibold text-[11px] text-center">Pending</span>
                    </li>
                    <li className="flex flex-col items-center">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-lg transition-all duration-150
                        ${order.state === 'PAID' ? 'bg-destructive border-destructive text-white scale-110' : (order.state === 'SHIPPED' || order.state === 'DELIVERED') ? 'bg-gray-700 border-gray-500 text-gray-300' : 'bg-gray-700 border-gray-500 text-gray-300'}
                      `}>
                        2
                      </span>
                      <span className="mt-1 font-semibold text-[11px] text-center">Paid</span>
                    </li>
                    <li className="flex flex-col items-center">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-lg transition-all duration-150
                        ${order.state === 'SHIPPED' ? 'bg-destructive border-destructive text-white scale-110' : order.state === 'DELIVERED' ? 'bg-gray-700 border-gray-500 text-gray-300' : 'bg-gray-700 border-gray-500 text-gray-300'}
                      `}>
                        3
                      </span>
                      <span className="mt-1 font-semibold text-[11px] text-center">Shipped</span>
                    </li>
                    <li className="flex flex-col items-center">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full border-4 shadow-lg font-extrabold text-lg transition-all duration-150
                        ${order.state === 'DELIVERED' ? 'bg-destructive border-destructive text-white scale-110' : 'bg-gray-700 border-gray-500 text-gray-300'}
                      `}>
                        4
                      </span>
                      <span className="mt-1 font-semibold text-[11px] text-center">Delivered</span>
                    </li>
                  </ol>
                </div>
                <h1 className="text-2xl font-extrabold text-center mb-4 text-white">Order Details</h1>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <span className="text-base text-gray-400">Order Date: {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                  <span className="text-base text-gray-400">Buyer: {order.buyerName || order.buyerUid}</span>
                  <span className="text-base text-gray-400">Seller: {order.sellerName || order.sellerUid}</span>
                </div>
                <div className="flex items-center gap-4 justify-center">
                  {order.items?.[0]?.imageUrl && (
                    <img
                      src={order.items[0].imageUrl}
                      alt={order.items[0].title ?? "Item"}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded border object-cover"
                    />
                  )}
                  <p className="font-bold text-xl xs:text-2xl text-center text-white">
                    {order.items?.[0]?.title ?? "Order"}
                  </p>
                </div>
                <p className="text-lg text-white font-bold">${order.subtotal?.toFixed(2)}</p>
                {order.shippingCost !== undefined && (
                  <p className="text-base text-gray-400">Shipping: ${order.shippingCost?.toFixed(2)}</p>
                )}
                {order.fees !== undefined && (
                  <p className="text-base text-gray-400">Fees: ${order.fees?.toFixed(2)}</p>
                )}
                {order.total !== undefined && (
                  <p className="text-lg text-yellow-400 font-bold">Total: ${order.total?.toFixed(2)}</p>
                )}
                <p className="text-base text-gray-300">Status: <span className="font-bold text-yellow-400">{order.status || order.state}</span></p>
                {order.trackingNumber && (
                  <div className="mt-2 flex flex-col items-center w-full xs:w-2/3 md:w-1/2">
                    <span className="font-semibold text-base text-blue-700">Tracking:</span>
                    <span className="text-sm text-muted-foreground mb-1">{order.carrier}</span>
                    {(() => {
                      const tracking = order.trackingNumber;
                      // If you want to link to Shippo or a generic tracking page, add logic here
                      return <>
                        <span className="inline-block px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold text-lg border-2 border-gray-400 mt-1 tracking-wide">
                          {tracking}
                        </span>
                        {estDelivery && (
                          <span className="text-xs text-green-700 mt-2">Estimated delivery: {estDelivery.toLocaleDateString()}</span>
                        )}
                      </>;
                    })()}
                    {/* Contact Seller Button */}
                    {contactSellerBtn}
                  </div>
                )}
                {/* Shipping Address (always show) */}
                <div className="mt-4 text-base text-gray-400 text-center">
                  <span className="font-semibold">Shipping Address:</span><br />
                  {order.shippingAddress ? (
                    <>
                      {order.shippingAddress.name && <span>{order.shippingAddress.name}<br /></span>}
                      {order.shippingAddress.line1}<br />
                      {order.shippingAddress.line2 && <span>{order.shippingAddress.line2}<br /></span>}
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                    </>
                  ) : (
                    <span className="italic text-gray-400">Not provided</span>
                  )}
                </div>
                {/* Payment Method (always show) */}
                <div className="mt-2 text-base text-gray-400 text-center">
                  <span className="font-semibold">Payment Method:</span> {order.paymentMethod ? order.paymentMethod : <span className="italic text-gray-400">Not provided</span>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

