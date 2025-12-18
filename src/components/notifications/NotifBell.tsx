"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function NotifBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const qNotif = query(
      collection(db, "notifications"),
      where("uid", "==", user.uid),
      where("seen", "==", false)
    );

    let unsub: (() => void) | undefined = undefined;
    try {
      unsub = onSnapshot(qNotif, (snap) => {
        setCount(snap.size);
      });
    } catch (err) {
      console.error('NotifBell: onSnapshot failed', err);
    }

    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (e) {
        console.warn('NotifBell: error during unsubscribe', e);
      }
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link href="/notifications" className="relative">
      🔔
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
          {count}
        </span>
      )}
    </Link>
  );
}
