"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Strict Firestore read gate
    const canReadFirestore = !!user && user.emailVerified;
    if (!canReadFirestore) return;

    if (!db) return;
    const q = query(
      collection(db!, "orders"),
      where("buyerUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.map((o) => (
        <Link key={o.id} href={`/orders/${o.id}`}>
          <div className="p-4 border rounded bg-white shadow cursor-pointer">
            <p className="font-semibold">{o.listingTitle}</p>
            <p>${o.amount}</p>
            <p>Status: {o.status}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
