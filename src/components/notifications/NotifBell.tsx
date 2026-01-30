"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function NotifBell() {
  const { user, loading } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (loading || !user?.uid || !db) return;

    const qNotif = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    const unsub = onSnapshot(qNotif, (snapshot) => {
      setCount(snapshot.size);
    });
    return () => unsub();
  }, [user, loading, db]);

  if (!user) {
    return null;
  }

  return (
    <Link href="/notifications" className="relative">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white shadow-[0_4px_0_#bfa100] active:translate-y-1 active:shadow-[0_0px_0_#bfa100] transition-all hover:bg-yellow-500 focus:outline-none"
        role="img"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
          {count}
        </span>
      )}
    </Link>
  );
}
