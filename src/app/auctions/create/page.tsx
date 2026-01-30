"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebase } from "@/firebase/client-init";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";

// FeePreview component moved outside of CreateAuctionPage for proper scope
function FeePreview({ tier, startingPrice }: { tier: string | undefined; startingPrice: string }) {
  if (!tier || !startingPrice) return null;
  const base = parseFloat(startingPrice) || 0;
  let fee = 0;
  let min = 0;
  let label = "";
  if (tier === "SILVER") {
    fee = Math.max(Math.round(base * 0.05 * 100) / 100, 10);
    min = 10;
    label = `Silver: 5% upfront fee (min $10)`;
  } else if (tier === "GOLD") {
    fee = Math.max(Math.round(base * 0.02 * 100) / 100, 5);
    min = 5;
    label = `Gold: 2% upfront fee (min $5)`;
  }
  if (!fee) return null;
  return (
    <div className="mt-2 text-sm text-blue-900 font-semibold">
      {label}: <span className="font-bold">${fee.toFixed(2)}</span> (on ${base.toFixed(2)} starting price)
    </div>
  );
}

export default function CreateAuctionPage() {
  const { firestore: db } = getFirebase();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [startingPrice, setStartingPrice] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user || !db) return;
    if (profile?.tier !== "SILVER" && profile?.tier !== "GOLD") {
      setError("Only Silver and Gold sellers can create auctions.");
      return;
    }
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "auctions"), {
        title,
        endsAt: new Date(endsAt),
        sellerUid: user.uid,
        status: "OPEN",
        createdAt: serverTimestamp(),
        startingPrice: parseFloat(startingPrice) || 0,
      });
      router.push(`/auctions/${docRef.id}`);
    } catch (err) {
      setError("Failed to create auction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Create Auction</h1>
        <div className="mb-4 p-3 border-2 border-primary bg-card/80 rounded-lg">
          <div className="font-bold mb-1">Auction Fee Rules</div>
          <ul className="list-disc ml-5 text-sm">
            <li>Only <span className="font-bold">Silver</span> and <span className="font-bold">Gold</span> sellers can create auctions.</li>
            <li><span className="font-bold">Silver</span>: 5% upfront fee (of starting price), <span className="font-bold">minimum $10</span>, <span className="font-bold">0% after-sale fee</span></li>
            <li><span className="font-bold">Gold</span>: 2% upfront fee (of starting price), <span className="font-bold">minimum $5</span>, <span className="font-bold">0% after-sale fee</span></li>
            <li>No backend/final value fees when the auction ends.</li>
          </ul>
          <FeePreview tier={profile?.tier as string | undefined} startingPrice={startingPrice} />
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              required
              placeholder="Enter auction title"
              title="Auction Title"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Starting Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={startingPrice}
              onChange={e => setStartingPrice(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              required
              placeholder="Enter starting price"
              title="Starting Price"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">End Date/Time</label>
              <input
              type="datetime-local"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              required
              placeholder="Select end date and time"
            />
          </div>
          <button type="submit" className="comic-button" disabled={loading}>Create Auction</button>
        </form>
      </div>
    </AppLayout>
  );
}
