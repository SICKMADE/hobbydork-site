"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const { user, profile, loading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const canReadFirestore =
    !loading &&
    !!user &&
    user.emailVerified &&
    profile?.status === "ACTIVE";

  useEffect(() => {
    if (!canReadFirestore) return;
    if (!db) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFirestoreError(null);
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Notification)
        );

        setItems(data);

        // mark unread as read
        data.forEach((n) => {
          if (!n.read) {
            updateDoc(
              doc(db!, "users", user.uid, "notifications", n.id),
              { read: true }
            ).catch(() => {});
          }
        });
      },
      (err) => {
        if (err && err.code === "permission-denied") {
          setFirestoreError("You do not have permission to view notifications.");
        } else {
          setFirestoreError("An error occurred loading notifications.");
        }
      }
    );

    return () => unsub();
  }, [canReadFirestore, user]);

  if (loading) return null;
  if (!user) return <div className="p-6">Sign in required.</div>;
  if (!user.emailVerified)
    return <div className="p-6">Verify your email to view notifications.</div>;
  if (firestoreError)
    return <div className="p-6 text-red-600">{firestoreError}</div>;

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
              <span className="text-xs text-gray-500">
                {n.createdAt?.toDate?.().toLocaleString?.() ?? ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
