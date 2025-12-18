"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function AdminOrdersPage() {
  const { userData } = useAuth();
  if (userData.role !== "ADMIN") {
    return <div className="p-6">You do not have access.</div>;
  }

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "orders"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading Orders…</div>;

  // Update field helpers
  async function markFraud(id: string) {
    const reason = prompt("Fraud Reason:");
    await updateDoc(doc(db, "orders", id), {
      fraudFlag: true,
      fraudReason: reason || "Suspicious activity",
      updatedAt: serverTimestamp(),
    });
  }

  async function clearFraud(id: string) {
    await updateDoc(doc(db, "orders", id), {
      fraudFlag: false,
      fraudReason: null,
      updatedAt: serverTimestamp(),
    });
  }

  async function addDispute(id: string) {
    const notes = prompt("Dispute Notes:");
    await updateDoc(doc(db, "orders", id), {
      dispute: true,
      disputeNotes: notes || "Dispute opened",
      updatedAt: serverTimestamp(),
    });
  }

  async function clearDispute(id: string) {
    await updateDoc(doc(db, "orders", id), {
      dispute: false,
      disputeNotes: null,
      updatedAt: serverTimestamp(),
    });
  }

  async function lockOrder(id: string) {
    await updateDoc(doc(db, "orders", id), {
      adminLocked: true,
      updatedAt: serverTimestamp(),
    });
  }

  async function unlockOrder(id: string) {
    await updateDoc(doc(db, "orders", id), {
      adminLocked: false,
      updatedAt: serverTimestamp(),
    });
  }

  async function addNote(id: string) {
    const note = prompt("Admin Note:");
    await updateDoc(doc(db, "orders", id), {
      adminNotes: note || "",
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Order Moderation</h1>

      {orders.map((o) => (
        <div key={o.id} className="border bg-white shadow p-4 rounded space-y-3">

          {/* Order header */}
          <div className="flex justify-between items-center">
            <p className="font-semibold text-lg">Order #{o.id}</p>
            <p>Status: {o.status}</p>
          </div>

          {/* Buyer + Seller */}
          <div className="text-sm space-y-1">
            <p>
              <strong>Buyer:</strong>{" "}
              <Link href={`/store/${o.buyerStoreId || o.buyerUid}`} className="underline">
                {o.buyerUid}
              </Link>
            </p>
            <p>
              <strong>Seller:</strong>{" "}
              <Link href={`/store/${o.sellerStoreId || o.sellerUid}`} className="underline">
                {o.sellerUid}
              </Link>
            </p>
            <p>
              <strong>Listing:</strong>{" "}
              <Link href={`/listings/${o.listingId}`} className="underline">
                {o.listingId}
              </Link>
            </p>
          </div>

          {/* Stripe data */}
          <div className="text-sm text-gray-700 space-y-1">
            <p>Checkout Session: {o.stripeSessionId}</p>
            <p>Payment Intent: {o.stripePaymentIntent}</p>
            <p>Payout ID: {o.stripePayoutId || "None Yet"}</p>
          </div>

          {/* Indicators */}
          <div className="space-y-1">
            {o.fraudFlag && (
              <p className="text-red-600 text-sm">
                🚨 FRAUD FLAG — {o.fraudReason}
              </p>
            )}
            {o.dispute && (
              <p className="text-orange-600 text-sm">
                ⚠️ DISPUTE — {o.disputeNotes}
              </p>
            )}
            {o.adminLocked && (
              <p className="text-blue-600 text-sm">🔒 Order Locked</p>
            )}
          </div>

          {/* Admin Actions */}
          <div className="flex flex-wrap gap-2 pt-2">

            {/* Fraud Controls */}
            {!o.fraudFlag ? (
              <button
                onClick={() => markFraud(o.id)}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Mark Fraud
              </button>
            ) : (
              <button
                onClick={() => clearFraud(o.id)}
                className="px-3 py-1 bg-gray-700 text-white rounded"
              >
                Clear Fraud
              </button>
            )}

            {/* Dispute Controls */}
            {!o.dispute ? (
              <button
                onClick={() => addDispute(o.id)}
                className="px-3 py-1 bg-orange-500 text-white rounded"
              >
                Add Dispute
              </button>
            ) : (
              <button
                onClick={() => clearDispute(o.id)}
                className="px-3 py-1 bg-gray-700 text-white rounded"
              >
                Clear Dispute
              </button>
            )}

            {/* Lock controls */}
            {!o.adminLocked ? (
              <button
                onClick={() => lockOrder(o.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Lock Order
              </button>
            ) : (
              <button
                onClick={() => unlockOrder(o.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Unlock Order
              </button>
            )}

            {/* Admin Notes */}
            <button
              onClick={() => addNote(o.id)}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Add Note
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
