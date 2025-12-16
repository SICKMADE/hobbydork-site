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

type OrderStatus =
  | "REQUESTED"
  | "INVOICED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export default function OrderDetail({ params }: any) {
  const { user } = useAuth();
  const { orderId } = params;

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const ref = doc(db, "orders", orderId);
    const unsub = onSnapshot(ref, (snap) => {
      setOrder({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [orderId]);

  if (!order || !user) return <div className="p-6">Loading…</div>;

  const isBuyer = order.buyerUid === user.uid;
  const isSeller = order.sellerUid === user.uid;

  async function payNow() {
    const fn = httpsCallable(getFunctions(), "createCheckoutSession");
    const amountCents = Math.round(order.amount * 100);

    const res: any = await fn({
      orderId: order.id,
      listingTitle: order.listingTitle,
      amountCents,
    });

    window.location.href = res.data.url;
  }

  async function markShipped(trackingNumber: string, carrier: string) {
    await updateDoc(doc(db, "orders", orderId), {
      trackingNumber,
      carrier,
      status: "SHIPPED",
      shippedAt: serverTimestamp(),
    });
  }

  async function confirmDelivered() {
    await updateDoc(doc(db, "orders", orderId), {
      status: "DELIVERED",
      deliveredAt: serverTimestamp(),
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">Order Details</h1>

      <div className="p-4 border rounded bg-white shadow space-y-2">
        <p className="font-semibold text-xl">{order.listingTitle}</p>
        <p>${order.amount}</p>
        <p>Status: {order.status}</p>

        {order.trackingNumber && (
          <p className="mt-2">
            Tracking: {order.carrier} — {order.trackingNumber}
          </p>
        )}
      </div>

      {/* BUYER ACTIONS */}
      {isBuyer && order.status === "INVOICED" && (
        <button
          onClick={payNow}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Pay with Stripe
        </button>
      )}

      {isBuyer && order.status === "DELIVERED" && (
        <p className="text-green-600 font-semibold">
          Order delivered. You may now leave feedback.
        </p>
      )}

      {isBuyer && order.status === "SHIPPED" && (
        <button
          onClick={confirmDelivered}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Confirm Delivered
        </button>
      )}

      {/* SELLER ACTIONS */}
      {isSeller && order.status === "PAID" && (
        <SellerFulfillForm onSubmit={markShipped} />
      )}
    </div>
  );
}

// Seller fulfillment form
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
