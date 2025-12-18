"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/lib/types";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export default function SellerListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Partial<Listing>[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "listings"),
      where("ownerUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<Listing>) })));
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Listings</h1>

      {listings.map((l) => (
        <div key={l.id} className="border p-4 bg-white rounded shadow space-y-2">
          <p className="font-semibold">{l.title}</p>
          <p>Status: {l.state}</p>

          <Link href={`/listings/${l.id}`}>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">
              Edit Listing
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
}
