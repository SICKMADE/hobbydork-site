"use client";

import React, { useEffect, useState } from "react";
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

type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";


export default function OrderDetail({ params }: any) {
  const { user } = useAuth();
  // Next.js passes params as { orderId: string }
  const orderId = params?.orderId;

  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);

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
          subtotal: data.subtotal,
          shippingAddress: data.shippingAddress,
          // Add other essential fields as needed
        });
      }
    });
    return () => unsub();
  }, [orderId, user]);

  if (!order || !user) {
    return <div className="p-6">Loading…</div>;
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

  // Progress bar logic
  const statusSteps = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED"];
  const currentStep = statusSteps.indexOf(order.state);
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
    let estDays = 3;
    const carrier = order.carrier?.toLowerCase();
    if (carrier === "usps") estDays = 3;
    else if (carrier === "ups" || carrier === "fedex") estDays = 2;
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-2 xs:p-4 bg-transparent">
      <div className="w-full max-w-3xl border-2 border-destructive bg-card/80 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-4 p-4 md:p-6 border-b border-gray-700 w-full">
          <img src="/order.png" alt="Order" className="w-full max-w-full h-40 mb-4 object-contain" />
          {/* Order Progress Bar */}
          <div className="w-full flex flex-col items-center mb-4">
            <div className="w-full xs:w-2/3 md:w-1/2 h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-3 bg-yellow-400 rounded-full transition-all duration-300 w-[${progressPercent}%]`}
              ></div>
            </div>
            <div className="flex justify-between w-full xs:w-2/3 md:w-1/2 text-xs text-gray-300">
              <span>Pending</span>
              <span>Paid</span>
              <span>Shipped</span>
              <span>Delivered</span>
            </div>
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
          <p className="text-base text-gray-300">Status: <span className="font-bold text-yellow-400">{order.state}</span></p>
          {order.trackingNumber && (
            <div className="mt-2 flex flex-col items-center w-full xs:w-2/3 md:w-1/2">
              <span className="font-semibold text-base text-blue-700">Tracking:</span>
              <span className="text-sm text-muted-foreground mb-1">{order.carrier}</span>
              {(() => {
                const carrier = order.carrier?.toLowerCase();
                const tracking = order.trackingNumber;
                let url = null;
                if (carrier === "usps") {
                  url = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
                } else if (carrier === "ups") {
                  url = `https://www.ups.com/track?tracknum=${tracking}`;
                } else if (carrier === "fedex") {
                  url = `https://www.fedex.com/fedextrack/?tracknumbers=${tracking}`;
                }
                return <>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="block w-full xs:w-auto px-4 py-2 rounded bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-all text-base xs:text-lg border-2 border-blue-800 text-center mt-1 tracking-wide"
                    >
                      {tracking}
                    </a>
                  ) : (
                    <span className="inline-block px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold text-lg border-2 border-gray-400 mt-1 tracking-wide">
                      {tracking}
                    </span>
                  )}
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
        <div className="flex flex-col gap-6 items-center p-8">
          {/* Helpful Tips / Next Steps */}
          <div className="w-full mb-4">
            {isBuyer && order.state === "PENDING_PAYMENT" && (
              <div className="text-base text-yellow-400 bg-background/80 border border-yellow-700 rounded-lg p-3 text-center font-semibold">
                <strong>Next Step:</strong> Complete your payment to start processing your order.
              </div>
            )}
            {isBuyer && order.state === "SHIPPED" && (
              <div className="text-base text-blue-400 bg-background/80 border border-blue-700 rounded-lg p-3 text-center font-semibold">
                <strong>Next Step:</strong> Track your shipment and confirm delivery once received.
              </div>
            )}
            {isBuyer && order.state === "DELIVERED" && (
              <div className="text-base text-green-400 bg-background/80 border border-green-700 rounded-lg p-3 text-center font-semibold">
                <strong>Next Step:</strong> Leave feedback for your seller or report any issues.
              </div>
            )}
            {isSeller && order.state === "PAID" && (
              <div className="text-base text-blue-400 bg-background/80 border border-blue-700 rounded-lg p-3 text-center font-semibold">
                <strong>Next Step:</strong> Fulfill the order and provide tracking info to the buyer.
              </div>
            )}
            {isSeller && order.state === "SHIPPED" && (
              <div className="text-base text-green-400 bg-background/80 border border-green-700 rounded-lg p-3 text-center font-semibold">
                <strong>Next Step:</strong> Wait for buyer to confirm delivery and leave feedback.
              </div>
            )}
            {isSeller && order.state === "DELIVERED" && (
              <div className="text-base text-emerald-400 bg-background/80 border border-emerald-700 rounded-lg p-3 text-center font-semibold">
                <strong>Order Complete:</strong> Thank you for fulfilling the order!
              </div>
            )}
          </div>
          {/* Order Timeline/History */}
          <div className="w-full xs:w-2/3 md:w-1/2 mb-4">
            <h2 className="text-lg font-bold text-white mb-2">Order Timeline</h2>
            <ul className="text-xs text-gray-300">
              {timeline.length === 0 ? (
                <li className="italic text-gray-500">No timeline data available.</li>
              ) : (
                timeline.map((event, idx) => (
                  <li key={idx} className="mb-1 flex justify-between">
                    <span>{event.label}</span>
                    <span className="text-gray-400">{event.date}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          {/* BUYER */}
          {isBuyer && order.state === "PENDING_PAYMENT" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={payNow}
                    className="comic-button bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 custom-btn-shadow custom-letter custom-textshadow w-full xs:w-auto"
                  >
                    <span className="drop-shadow-lg tracking-wide">Pay with Stripe</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Secure payment via Stripe. Your card info is never stored by HobbyDork.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isBuyer && order.state === "SHIPPED" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={confirmDelivered}
                      className="comic-button bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-green-400 custom-btn-shadow custom-letter custom-textshadow w-full xs:w-auto"
                    >
                      <span className="drop-shadow-lg tracking-wide">Confirm Delivered</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to confirm you received your order. This helps sellers get paid faster.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <a
                href={`/help?orderId=${order.id}`}
                className="comic-button bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 custom-btn-shadow custom-letter custom-textshadow mt-2 w-full xs:w-auto"
              >
                Shipping Issue? Contact Support
              </a>
              {/* Contact Seller Button */}
              {contactSellerBtn}
            </>
          )}
          {isBuyer && order.state === "DELIVERED" && (
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-green-600 font-semibold text-base text-center">
                Order delivered. You may now leave feedback.
              </p>
              <a
                href={`/reviews/leave?orderId=${order.id}`}
                className="comic-button bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-emerald-400 custom-btn-shadow custom-letter custom-textshadow w-full xs:w-auto"
              >
                Leave Feedback
              </a>
              <a
                href={`/reports/new?targetUid=${order.sellerUid}&orderId=${order.id}`}
                className="comic-button bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 custom-btn-shadow custom-letter custom-textshadow mt-2 w-full xs:w-auto"
              >
                Report Seller
              </a>
              {/* Contact Seller Button */}
              {contactSellerBtn}
            </div>
          )}
          {/* SELLER */}
          {isSeller && order.state === "PAID" && (
            <SellerFulfillForm onSubmit={markShipped} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- SELLER FULFILLMENT ---------------- */

function SellerFulfillForm({ onSubmit }: any) {
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [labelPurchased, setLabelPurchased] = useState(false);

  // Placeholder for label purchase logic
  function handlePurchaseLabel() {
    // In a real integration, this would open a shipping label purchase flow
    setLabelPurchased(true);
  }

  const canMarkShipped = labelPurchased && carrier.trim() && tracking.trim();

  return (
    <div className="p-3 xs:p-4 border rounded bg-white shadow space-y-2 xs:space-y-3">
      <p className="font-semibold text-base xs:text-lg">Fulfill Order</p>

      <button
        className={`w-full sm:w-auto px-4 py-2 rounded text-sm xs:text-base ${labelPurchased ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        onClick={handlePurchaseLabel}
        disabled={labelPurchased}
        type="button"
      >
        {labelPurchased ? 'Shipping Label Purchased' : 'Purchase Shipping Label'}
      </button>

      <input
        className="border p-2 rounded w-full mt-2 text-sm xs:text-base"
        placeholder="Carrier (USPS, UPS, FedEx)"
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        disabled={!labelPurchased}
      />

      <input
        className="border p-2 rounded w-full text-sm xs:text-base"
        placeholder="Tracking Number"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        disabled={!labelPurchased}
      />

      <button
        onClick={() => onSubmit(tracking, carrier)}
        className={`w-full sm:w-auto px-4 py-2 rounded text-sm xs:text-base ${canMarkShipped ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}
        disabled={!canMarkShipped}
        type="button"
      >
        Mark as Shipped
      </button>
      {!labelPurchased && (
        <p className="text-xs text-muted-foreground mt-1">You must purchase a shipping label before entering tracking info.</p>
      )}
    </div>
  );
}
