"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getFirebase } from "@/firebase/client-init";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";

export default function AuctionsListPage() {
  const { firestore: db } = getFirebase();
  const [auctions, setAuctions] = useState<any[]>([]);
  useEffect(() => {
    if (!db) return;
    const fetchAuctions = async () => {
      const q = query(collection(db, "auctions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAuctions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchAuctions();
  }, [db]);
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Auctions</h1>
        <Link href="/auctions/create" className="comic-button mb-4 inline-block">Create Auction</Link>
        {auctions.length === 0 ? (
          <div className="text-muted-foreground">No auctions found.</div>
        ) : (
          <ul className="space-y-4">
            {auctions.map(auction => (
              <li key={auction.id} className="border rounded p-4 bg-background/80">
                <div className="font-bold text-lg">{auction.title}</div>
                <div>Status: <span className="font-semibold">{auction.status}</span></div>
                <div>Ends: {auction.endsAt?.seconds ? new Date(auction.endsAt.seconds * 1000).toLocaleString() : "N/A"}</div>
                <Link href={`/auctions/${auction.id}`} className="text-primary underline text-xs font-bold">View Auction</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
