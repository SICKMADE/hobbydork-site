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
    if (loading || !user?.uid || !db) return;

    const notifPath = `/users/${user.uid}/notifications`;
    // ...existing code...

    const qNotif = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(
        qNotif,
        (snap) => {
          setCount(snap.size);
        },
        (err) => {
          console.error('[NotifBell] Firestore onSnapshot error:', err);
        }
      );
    } catch (e) {
      console.error('[NotifBell] Firestore onSnapshot setup error:', e);
    }

    return () => {
      if (typeof unsub === 'function') {
        try { unsub(); } catch {}
      }
    };
  }, [user, loading, db]);

  if (!user) {
    return null;
  }

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
