"use client";

import { useEffect, useState } from "react";
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
  const { id: orderId } = params;

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
        appBaseUrl: window.location.origin,
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

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] p-2 xs:p-4 bg-grid"
    >
      <div className="w-full max-w-xl md:max-w-2xl border-4 border-yellow-400 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col items-center gap-2 p-6 border-b-2 border-yellow-300">
          {/* Order Timeline/Status Tracker */}
          <div className="w-full flex justify-center mb-4">
            <ol className="flex items-center space-x-4 text-xs">
              <li className={`flex flex-col items-center ${order.state === 'PENDING_PAYMENT' ? 'text-yellow-600 font-bold' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-yellow-400 bg-yellow-100">1</span>
                <span>Pending</span>
              </li>
              <li className={`flex flex-col items-center ${order.state === 'PAID' ? 'text-blue-600 font-bold' : order.state === 'SHIPPED' || order.state === 'DELIVERED' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-blue-400 bg-blue-100">2</span>
                <span>Paid</span>
              </li>
              <li className={`flex flex-col items-center ${order.state === 'SHIPPED' ? 'text-green-600 font-bold' : order.state === 'DELIVERED' ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-green-400 bg-green-100">3</span>
                <span>Shipped</span>
              </li>
              <li className={`flex flex-col items-center ${order.state === 'DELIVERED' ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-100">4</span>
                <span>Delivered</span>
              </li>
            </ol>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Order Details</h1>
          <div className="flex flex-col items-center gap-1 mb-2">
            <span className="text-sm text-muted-foreground">Order Date: {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
            <span className="text-sm text-muted-foreground">Buyer: {order.buyerName || order.buyerUid}</span>
            <span className="text-sm text-muted-foreground">Seller: {order.sellerName || order.sellerUid}</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            {order.items?.[0]?.imageUrl && (
              <img
                src={order.items[0].imageUrl}
                alt={order.items[0].title ?? "Item"}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded border object-cover"
              />
            )}
            <p className="font-semibold text-lg xs:text-xl text-center">
              {order.items?.[0]?.title ?? "Order"}
            </p>
          </div>
          <p className="text-base text-muted-foreground">${order.subtotal?.toFixed(2)}</p>
          {order.shippingCost !== undefined && (
            <p className="text-base text-muted-foreground">Shipping: ${order.shippingCost?.toFixed(2)}</p>
          )}
          {order.fees !== undefined && (
            <p className="text-base text-muted-foreground">Fees: ${order.fees?.toFixed(2)}</p>
          )}
          {order.total !== undefined && (
            <p className="text-base text-muted-foreground font-bold">Total: ${order.total?.toFixed(2)}</p>
          )}
          <p className="text-base text-muted-foreground">Status: <span className="font-bold">{order.state}</span></p>
          {order.trackingNumber && (
            <div className="mt-2 flex flex-col items-center">
              <span className="font-semibold text-base text-blue-700">Tracking:</span>
              <span className="text-sm text-muted-foreground mb-1">{order.carrier}</span>
              {(() => {
                const carrier = order.carrier?.toLowerCase();
                const tracking = order.trackingNumber;
                let url = null;
                let estDays = 3;
                if (carrier === "usps") {
                  url = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
                  estDays = 3;
                } else if (carrier === "ups") {
                  url = `https://www.ups.com/track?tracknum=${tracking}`;
                  estDays = 2;
                } else if (carrier === "fedex") {
                  url = `https://www.fedex.com/fedextrack/?tracknumbers=${tracking}`;
                  estDays = 2;
                }
                const estDelivery = order.shippedAt?.seconds ? new Date(order.shippedAt.seconds * 1000 + estDays * 86400000) : null;
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
            </div>
          )}
          {/* Shipping Address (always show) */}
          <div className="mt-2 text-sm text-muted-foreground text-center">
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
          <div className="mt-2 text-sm text-muted-foreground text-center">
            <span className="font-semibold">Payment Method:</span> {order.paymentMethod ? order.paymentMethod : <span className="italic text-gray-400">Not provided</span>}
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center p-6">
                    {/* Helpful Tips / Next Steps */}
                    <div className="w-full mb-4">
                      {isBuyer && order.state === "PENDING_PAYMENT" && (
                        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                          <strong>Next Step:</strong> Complete your payment to start processing your order.
                        </div>
                      )}
                      {isBuyer && order.state === "SHIPPED" && (
                        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 text-center">
                          <strong>Next Step:</strong> Track your shipment and confirm delivery once received.
                        </div>
                      )}
                      {isBuyer && order.state === "DELIVERED" && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 text-center">
                          <strong>Next Step:</strong> Leave feedback for your seller or report any issues.
                        </div>
                      )}
                      {isSeller && order.state === "PAID" && (
                        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 text-center">
                          <strong>Next Step:</strong> Fulfill the order and provide tracking info to the buyer.
                        </div>
                      )}
                      {isSeller && order.state === "SHIPPED" && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 text-center">
                          <strong>Next Step:</strong> Wait for buyer to confirm delivery and leave feedback.
                        </div>
                      )}
                      {isSeller && order.state === "DELIVERED" && (
                        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 text-center">
                          <strong>Order Complete:</strong> Thank you for fulfilling the order!
                        </div>
                      )}
                    </div>
          {/* BUYER */}
          {isBuyer && order.state === "PENDING_PAYMENT" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={payNow}
                    className="w-40 inline-flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_6px_0_#312e81] active:translate-y-1 active:shadow-[0_0px_0_#312e81] transition-all text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
                  >
                    Pay with Stripe
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
                      className="w-full xs:w-40 inline-flex items-center justify-center rounded-full bg-green-600 text-white shadow-[0_6px_0_#166534] active:translate-y-1 active:shadow-[0_0px_0_#166534] transition-all text-base xs:text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
                    >
                      Confirm Delivered
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to confirm you received your order. This helps sellers get paid faster.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <a
                href={`/help?orderId=${order.id}`}
                className="w-40 inline-flex items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 mt-2"
              >
                Shipping Issue? Contact Support
              </a>
            </>
          )}
          {isBuyer && order.state === "DELIVERED" && (
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-green-600 font-semibold text-base text-center">
                Order delivered. You may now leave feedback.
              </p>
              <a
                href={`/reviews/leave?orderId=${order.id}`}
                className="w-full xs:w-40 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_6px_0_#065f46] active:translate-y-1 active:shadow-[0_0px_0_#065f46] transition-all text-base xs:text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
              >
                Leave Feedback
              </a>
              <a
                href={`/reports/new?targetUid=${order.sellerUid}&orderId=${order.id}`}
                className="w-full xs:w-40 inline-flex items-center justify-center rounded-full bg-red-600 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all text-base xs:text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 mt-2"
              >
                Report Seller
              </a>
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
