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
    const ref = doc(db, "orders", orderId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [orderId]);

  if (!order || !user) {
    return <div className="p-6">Loading…</div>;
  }

  const isBuyer = order.buyerUid === user.uid;
  const isSeller = order.sellerUid === user.uid;

  /* ---------------- STRIPE PAY NOW ---------------- */

  async function payNow() {
    try {
      const fn = httpsCallable(getFunctions(), "createCheckoutSession");

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
        throw new Error("Stripe checkout URL missing");
      }

      window.location.href = url;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[checkout] payNow failed', err);
      toast({
        title: "Checkout failed",
        description: err?.message ?? "Stripe error",
        variant: "destructive",
      });
    }
  }

  /* ---------------- SELLER ACTIONS ---------------- */

  async function markShipped(trackingNumber: string, carrier: string) {
    await updateDoc(doc(db, "orders", orderId), {
      state: "SHIPPED",
      trackingNumber,
      carrier,
      shippedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /* ---------------- BUYER ACTIONS ---------------- */

  async function confirmDelivered() {
    await updateDoc(doc(db, "orders", orderId), {
      state: "DELIVERED",
      deliveredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">Order Details</h1>

      <div className="p-4 border rounded bg-white shadow space-y-2">
        <p className="font-semibold text-xl">
          {order.items?.[0]?.title ?? "Order"}
        </p>
        <p>${order.subtotal?.toFixed(2)}</p>
        <p>Status: {order.state}</p>

        {order.trackingNumber && (
          <p className="mt-2">
            Tracking: {order.carrier} — {order.trackingNumber}
          </p>
        )}
      </div>

      {/* BUYER */}
      {isBuyer && order.state === "PENDING_PAYMENT" && (
        <button
          onClick={payNow}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Pay with Stripe
        </button>
      )}

      {isBuyer && order.state === "SHIPPED" && (
        <button
          onClick={confirmDelivered}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Confirm Delivered
        </button>
      )}

      {isBuyer && order.state === "DELIVERED" && (
        <p className="text-green-600 font-semibold">
          Order delivered. You may now leave feedback.
        </p>
      )}

      {/* SELLER */}
      {isSeller && order.state === "PAID" && (
        <SellerFulfillForm onSubmit={markShipped} />
      )}
    </div>
  );
}

/* ---------------- SELLER FULFILLMENT ---------------- */

function SellerFulfillForm({ onSubmit }: any) {
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  return (
    <div className="p-4 border rounded bg-white shadow space-y-3">
      <p className="font-semibold text-lg">Fulfill Order</p>

      <input
        className="border p-2 rounded w-full"
        placeholder="Carrier (USPS, UPS, FedEx)"
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
      />

      <input
        className="border p-2 rounded w-full"
        placeholder="Tracking Number"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
      />

      <button
        onClick={() => onSubmit(tracking, carrier)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Mark as Shipped
      </button>
    </div>
  );
}
