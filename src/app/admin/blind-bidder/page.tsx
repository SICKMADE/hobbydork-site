"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";

export default function BlindBidderAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<any|null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchConfig() {
      if (!db) return;
      const configRef = doc(db, "config", "blindBidder");
      const configSnap = await getDoc(configRef);
      setEnabled(!!configSnap.data()?.enabled);
    }
    async function fetchAuctions() {
      if (!db) return;
      const snap = await getDocs(collection(db, "blindBidAuctions"));
      setAuctions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchConfig();
    fetchAuctions();
  }, []);

  async function toggleEnabled() {
    if (!db) return;
    const configRef = doc(db, "config", "blindBidder");
    await setDoc(configRef, { enabled: !enabled }, { merge: true });
    setEnabled(!enabled);
  }

  async function removeAuction(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, "blindBidAuctions", id));
    setAuctions(auctions.filter(a => a.id !== id));
  }

  async function relistAuction(id: string) {
    if (!db) return;
    await updateDoc(doc(db, "blindBidAuctions", id), { status: "OPEN", flatFeePaid: true });
    setAuctions(auctions.map(a => a.id === id ? { ...a, status: "OPEN", flatFeePaid: true } : a));
  }

  async function viewBids(auction: any) {
    if (!db) return;
    setSelectedAuction(auction);
    const bidsSnap = await getDocs(collection(db, "blindBidAuctions", auction.id, "bids"));
    setBids(bidsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function overrideWinner(bidId: string) {
    if (!db || !selectedAuction) return;
    await updateDoc(doc(db, "blindBidAuctions", selectedAuction.id), {
      winnerBidId: bidId,
      winnerUid: bids.find(b => b.id === bidId)?.bidderUid || null
    });
    toast({ title: "Winner overridden", description: "Winner has been updated." });
    setSelectedAuction(null);
    setBids([]);
    window.location.reload();
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">Blind Bidder Admin Controls</h1>
        <Button onClick={toggleEnabled} className="mb-4">
          {enabled ? "Deactivate Blind Bidder" : "Activate Blind Bidder"}
        </Button>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Auctions</h2>
          {loading ? <div>Loading...</div> : auctions.length === 0 ? <div>No auctions found.</div> : (
            <ul className="space-y-2">
              {auctions.map(a => (
                <li key={a.id} className="border p-2 rounded flex items-center justify-between">
                  <span>{a.title} ({a.status})</span>
                  <div className="space-x-2">
                    <Button variant="destructive" onClick={() => removeAuction(a.id)}>Remove</Button>
                    <Button onClick={() => relistAuction(a.id)} disabled={a.status === "OPEN"}>Relist (no fee)</Button>
                    <Button onClick={() => viewBids(a)} disabled={a.status !== "CLOSED"}>View Bids</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      {selectedAuction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Bids for {selectedAuction.title}</h2>
            {bids.length === 0 ? <div>No bids found.</div> : (
              <ul className="mb-4">
                {bids.sort((a, b) => b.amount - a.amount).map(bid => (
                  <li key={bid.id} className="flex justify-between items-center mb-2">
                    <span>${bid.amount.toFixed(2)} by {bid.bidderUid}</span>
                    <Button size="sm" onClick={() => overrideWinner(bid.id)}>Set as Winner</Button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" onClick={() => { setSelectedAuction(null); setBids([]); }}>Close</Button>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
