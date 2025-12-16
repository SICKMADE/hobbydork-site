"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

import { useAuth } from "@/hooks/use-auth";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);

      // Mark all as seen
      data.forEach((n) =>
        updateDoc(doc(db, "notifications", n.id), { seen: true })
      );
    });

    return () => unsub();
  }, [user]);

  if (!user) return <div className="p-6">Sign in required.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {items.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="border rounded p-4 bg-white shadow">
              <p className="font-semibold">{n.title}</p>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
