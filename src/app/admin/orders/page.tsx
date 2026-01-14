"use client";


import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
const dbSafe = db as import("firebase/firestore").Firestore;
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminOrdersPage() {
  const { userData } = useAuth();
  type Order = {
    id: string;
    status?: string;
    buyerStoreId?: string;
    buyerUid?: string;
    sellerStoreId?: string;
    sellerUid?: string;
    listingId?: string;
    stripeSessionId?: string;
    stripePaymentIntent?: string;
    stripePayoutId?: string;
    fraudFlag?: boolean;
    fraudReason?: string;
    dispute?: boolean;
    disputeNotes?: string;
    adminLocked?: boolean;
    adminNotes?: string;
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);




  useEffect(() => {
    async function load() {
      // Strict Firestore read gate
      const canReadFirestore = userData?.role === "ADMIN";
      if (!canReadFirestore) {
        setLoading(false);
        return;
      }
      const snap = await getDocs(collection(dbSafe, "orders"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      setOrders(data);
      setLoading(false);
    }
    load();
  }, [userData]);

  if (userData?.role !== "ADMIN") {
    return <div className="p-6">You do not have access.</div>;
  }
  if (loading) return <div className="p-6">Loading Orders…</div>;

  if (loading) return <div className="p-6">Loading Orders…</div>;

  // Update field helpers
  async function markFraud(id: string) {
    const reason = prompt("Fraud Reason:");
    await updateDoc(doc(dbSafe, "orders", id), {
      fraudFlag: true,
      fraudReason: reason || "Suspicious activity",
      updatedAt: serverTimestamp(),
    });
  }

  async function clearFraud(id: string) {
    await updateDoc(doc(dbSafe, "orders", id), {
      fraudFlag: false,
      fraudReason: null,
      updatedAt: serverTimestamp(),
    });
  }

  async function addDispute(id: string) {
    const notes = prompt("Dispute Notes:");
    await updateDoc(doc(dbSafe, "orders", id), {
      dispute: true,
      disputeNotes: notes || "Dispute opened",
      updatedAt: serverTimestamp(),
    });
  }

  async function clearDispute(id: string) {
    await updateDoc(doc(dbSafe, "orders", id), {
      dispute: false,
      disputeNotes: null,
      updatedAt: serverTimestamp(),
    });
  }

  async function lockOrder(id: string) {
    await updateDoc(doc(dbSafe, "orders", id), {
      adminLocked: true,
      updatedAt: serverTimestamp(),
    });
  }

  async function unlockOrder(id: string) {
    await updateDoc(doc(dbSafe, "orders", id), {
      adminLocked: false,
      updatedAt: serverTimestamp(),
    });
  }

  async function addNote(id: string) {
    const note = prompt("Admin Note:");
    await updateDoc(doc(dbSafe, "orders", id), {
      adminNotes: note || "",
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8 space-y-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Order Moderation</h1>
        <p className="text-base text-muted-foreground mt-1">Review and manage orders flagged for moderation</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {orders.map((o) => (
          <Card key={o.id} className={`rounded-2xl border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)] flex flex-col gap-2 ${o.fraudFlag ? 'border-red-600' : ''} ${o.dispute ? 'border-orange-500' : ''} ${o.adminLocked ? 'border-blue-600' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Order <span className="text-xs font-mono font-normal text-muted-foreground">#{o.id}</span>
              </CardTitle>
              <div className="text-sm font-semibold text-muted-foreground">Status: {o.status}</div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {/* Buyer + Seller */}
              <div className="text-sm space-y-1">
                <p>
                  <strong>Buyer:</strong>{' '}
                  <Link href={`/store/${o.buyerStoreId || o.buyerUid}`} className="text-primary underline font-bold">
                    {o.buyerUid}
                  </Link>
                </p>
                <p>
                  <strong>Seller:</strong>{' '}
                  <Link href={`/store/${o.sellerStoreId || o.sellerUid}`} className="text-primary underline font-bold">
                    {o.sellerUid}
                  </Link>
                </p>
                <p>
                  <strong>Listing:</strong>{' '}
                  <Link href={`/listings/${o.listingId}`} className="text-primary underline font-bold">
                    {o.listingId}
                  </Link>
                </p>
              </div>
              {/* Stripe data */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Checkout Session: {o.stripeSessionId}</p>
                <p>Payment Intent: {o.stripePaymentIntent}</p>
                <p>Payout ID: {o.stripePayoutId || 'None Yet'}</p>
              </div>
              {/* Indicators */}
              <div className="space-y-1">
                {o.fraudFlag && (
                  <p className="text-red-600 text-sm font-bold">
                    🚨 FRAUD FLAG — {o.fraudReason}
                  </p>
                )}
                {o.dispute && (
                  <p className="text-orange-600 text-sm font-bold">
                    ⚠️ DISPUTE — {o.disputeNotes}
                  </p>
                )}
                {o.adminLocked && (
                  <p className="text-blue-600 text-sm font-bold">🔒 Order Locked</p>
                )}
              </div>
              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {/* Fraud Controls */}
                {!o.fraudFlag ? (
                  <Button onClick={() => markFraud(o.id)} className="comic-button bg-red-600 border-red-600 text-white hover:bg-red-700" size="xs">Mark Fraud</Button>
                ) : (
                  <Button onClick={() => clearFraud(o.id)} className="comic-button bg-gray-700 border-gray-700 text-white hover:bg-gray-800" size="xs">Clear Fraud</Button>
                )}
                {/* Dispute Controls */}
                {!o.dispute ? (
                  <Button onClick={() => addDispute(o.id)} className="comic-button bg-orange-500 border-orange-500 text-white hover:bg-orange-600" size="xs">Add Dispute</Button>
                ) : (
                  <Button onClick={() => clearDispute(o.id)} className="comic-button bg-gray-700 border-gray-700 text-white hover:bg-gray-800" size="xs">Clear Dispute</Button>
                )}
                {/* Lock controls */}
                {!o.adminLocked ? (
                  <Button onClick={() => lockOrder(o.id)} className="comic-button bg-blue-600 border-blue-600 text-white hover:bg-blue-700" size="xs">Lock Order</Button>
                ) : (
                  <Button onClick={() => unlockOrder(o.id)} className="comic-button bg-blue-600 border-blue-600 text-white hover:bg-blue-700" size="xs">Unlock Order</Button>
                )}
                {/* Admin Notes */}
                <Button onClick={() => addNote(o.id)} className="comic-button bg-green-600 border-green-600 text-white hover:bg-green-700" size="xs">Add Note</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
