"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebase } from "@/firebase/client-init";
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";

export default function AuctionDetailPage({ params }: { params: any }) {
  // Next.js 15+: params may be a Promise, unwrap if needed
  const { auctionId } = typeof params?.then === 'function' ? React.use(params) : params;
  const { firestore: db } = getFirebase();
  const { user } = useAuth();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!db || !auctionId) return;
    const fetchAuction = async () => {
      const docRef = doc(db, "auctions", auctionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setAuction({ id: docSnap.id, ...docSnap.data() });
    };
    const fetchBids = async () => {
      const bidsQ = query(collection(db, "auctions", auctionId, "bids"), orderBy("amount", "desc"));
      const snap = await getDocs(bidsQ);
      setBids(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchAuction();
    fetchBids();
  }, [db, auctionId]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !auction) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "auctions", auction.id, "bids"), {
        bidderUid: user.uid,
        amount: parseFloat(bidAmount),
        createdAt: new Date(),
      });
      setBidAmount("");
      // Refresh bids
      const bidsQ = query(collection(db, "auctions", auction.id, "bids"), orderBy("amount", "desc"));
      const snap = await getDocs(bidsQ);
      setBids(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } finally {
      setLoading(false);
    }
  };

  if (!auction) return <AppLayout><div className="p-8">Loading auction…</div></AppLayout>;
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">{auction.title}</h1>
        <div>Status: <span className="font-semibold">{auction.status}</span></div>
        <div>Ends: {auction.endsAt?.seconds ? new Date(auction.endsAt.seconds * 1000).toLocaleString() : "N/A"}</div>
        <div className="mt-4">
          <h2 className="font-bold mb-2">Bids</h2>
          {bids.length === 0 ? <div>No bids yet.</div> : (
            <ul className="space-y-1">
              {bids.map(bid => (
                <li key={bid.id} className="border rounded p-2 flex justify-between">
                  <span>Bid: ${bid.amount.toFixed(2)}</span>
                  <span>{bid.bidderUid === user?.uid ? "(You)" : bid.bidderUid.slice(0, 6) + "…"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {auction.status === "OPEN" && user && (
          <form onSubmit={handleBid} className="mt-4 flex gap-2">
            <input type="number" step="0.01" min="0" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="border rounded px-2 py-1" placeholder="Your bid" required />
            <button type="submit" className="comic-button" disabled={loading}>Place Bid</button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
