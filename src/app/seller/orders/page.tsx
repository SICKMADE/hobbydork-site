"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

type Order = {
  id: string;
  listingTitle: string;
  amount: number;
  status: string;
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("sellerUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => {
          const data = d.data() as Partial<Order>;
          return {
            id: d.id,
            listingTitle: data.listingTitle ?? "",
            amount: typeof data.amount === "number" ? data.amount : 0,
            status: data.status ?? "",
          };
        })
      );
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Orders to Fulfill</h1>

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
