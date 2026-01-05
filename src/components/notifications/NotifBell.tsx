"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function NotifBell() {
  const { user, loading } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    // HARD GATES
    if (loading) return;
    if (!user?.uid) return;
    if (!user.emailVerified) return;
    if (!db) return;

    const notifPath = `/users/${user.uid}/notifications`;
    console.log('[NotifBell] Querying notifications for user:', user.uid, 'Path:', notifPath);

    const qNotif = query(
      collection(db!, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    const unsub = onSnapshot(
      qNotif,
      (snap) => {
        setCount(snap.size);
      },
      (err) => {
        console.error('[NotifBell] Firestore onSnapshot error:', err);
      }
    );

    return () => unsub();
  }, [user, loading]);

  if (!user || !user.emailVerified) return null;

  return (
    <Link href="/notifications" className="relative">
      <span role="img" aria-label="Notifications">🔔</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
          {count}
        </span>
      )}
    </Link>
  );
}
