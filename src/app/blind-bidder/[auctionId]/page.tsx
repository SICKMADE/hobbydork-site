"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getFunctions, httpsCallable } from "firebase/functions";
import Image from 'next/image';
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

function getCountdownColor(msLeft: number) {
  const hours = msLeft / (1000 * 60 * 60);
  if (hours > 8) return "text-green-500";
  if (hours > 3) return "text-yellow-500";
  return "text-red-500";
}

function formatDigitalClock(msLeft: number) {
  if (msLeft <= 0) return "00:00:00";
  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(":");
}

// TODO: Replace with actual Firestore fetch logic
async function fetchAuction(auctionId: string) {
  // Fetch auction details from Firestore
  const { getFirestore, doc, getDoc, collection, getDocs } = await import("firebase/firestore");
  let { db } = await import("@/firebase/client-provider");
  if (!db) db = getFirestore();
  const auctionRef = doc(db, "blindBidAuctions", auctionId);
  const auctionSnap = await getDoc(auctionRef);
  if (!auctionSnap.exists()) return null;
  const auction = auctionSnap.data();
  auction.id = auctionSnap.id;
  // Only fetch bids if auction is CLOSED
  let bids: { id: string; amount: number }[] = [];
  if (auction.status === "CLOSED") {
    const bidsRef = collection(db, "blindBidAuctions", auctionId, "bids");
    const bidsSnap = await getDocs(bidsRef);
    bids = bidsSnap.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, amount: typeof data.amount === 'number' ? data.amount : 0 };
    });
    // Sort bids by amount descending
    bids.sort((a, b) => b.amount - a.amount);
    auction.bids = bids;
  }
  return auction;
}


// Use Firebase SDK callable directly to avoid CORS issues
const functions = getFunctions();
const submitBlindBid = httpsCallable(functions, "submitBlindBid");

export default function BlindBidderAuctionPage({ params }: { params: any }) {
  const [seller, setSeller] = useState<any>(null);
  const { auctionId } = typeof params?.then === 'function' ? React.use(params) : params;
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update clock every second
  useEffect(() => {
    if (!auction?.endsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [auction?.endsAt]);

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    fetchAuction(auctionId as string).then((data) => {
      setAuction(data);
      setLoading(false);
      // Fetch seller info if auction loaded
      if (data?.sellerUid) {
        fetchSeller(data.sellerUid).then(setSeller);
      }
    });
  }, [auctionId]);

  // Fetch seller/store info from Firestore
  async function fetchSeller(sellerUid: string) {
    const { getFirestore, collection, query, where, getDocs } = await import("firebase/firestore");
    let { db } = await import("@/firebase/client-provider");
    if (!db) db = getFirestore();
    // Find store by ownerUid
    const q = query(collection(db, "stores"), where("ownerUid", "==", sellerUid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  async function handleBid() {
    if (!user || !user.emailVerified || profile?.status !== "ACTIVE") {
      toast({ title: "Not allowed", description: "You must verify your email and have an active account to bid.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid bid", description: "Enter a valid bid amount.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await submitBlindBid({ auctionId, amount });
      toast({ title: "Bid placed!", description: "Your bid is hidden until the auction ends." });
      setBidAmount("");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to place bid.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading auction…</div>;
  if (!auction) return <div>Auction not found.</div>;

  const isOpen = auction.status === "OPEN";

  // Calculate ms left
  let msLeft = 0;
  let endsAtDate: Date | null = null;
  if (auction?.endsAt) {
    if (typeof auction.endsAt === "object" && auction.endsAt !== null && "seconds" in auction.endsAt) {
      // Firestore Timestamp
      endsAtDate = new Date(auction.endsAt.seconds * 1000);
    } else if (typeof auction.endsAt === "string") {
      endsAtDate = new Date(auction.endsAt);
    } else if (typeof auction.endsAt === "number") {
      endsAtDate = new Date(auction.endsAt * 1000);
    }
    msLeft = endsAtDate ? endsAtDate.getTime() - now : 0;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{auction.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Seller Info Panel */}
            {seller && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded border border-black">
                <Avatar className="h-14 w-14 border-2 border-black">
                  <AvatarImage src={seller.avatarUrl || "/hobbydork-head.png"} />
                  <AvatarFallback>{seller.storeName?.charAt(0).toUpperCase() || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-lg">{seller.storeName || "Seller"}</div>
                  {typeof seller.ratingAverage === "number" && seller.ratingCount > 0 && (
                    <div className="flex items-center gap-2 text-yellow-500 text-xs">
                      <span>★ {seller.ratingAverage.toFixed(2)} ({seller.ratingCount})</span>
                    </div>
                  )}
                  {typeof seller.itemsSold === "number" && (
                    <div className="text-xs text-muted-foreground">Items sold: {seller.itemsSold}</div>
                  )}
                  <Link href={`/store/${seller.id}`} className="text-xs text-blue-600 underline">View Store</Link>
                </div>
              </div>
            )}
            {/* Auction Metadata */}
            <div className="mb-2 flex items-center gap-4">
              <span className={`font-mono text-2xl sm:text-3xl ${getCountdownColor(msLeft)}`}>{formatDigitalClock(msLeft)}</span>
              <span className="text-xs text-muted-foreground">Ends: {endsAtDate ? endsAtDate.toLocaleString() : ""}</span>
              {auction.category && (
                <span className="text-xs bg-gray-200 rounded px-2 py-1 ml-2">{auction.category.replace("_", " ")}</span>
              )}
            </div>
            <div className="mb-4">{auction.description}</div>
            {auction.imageUrl && (
              <Image
                src={auction.imageUrl}
                alt="Auction"
                width={480}
                height={240}
                className="max-h-60 mb-4 rounded"
                style={{ objectFit: 'contain' }}
                priority
              />
            )}
            {isOpen ? (
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); void handleBid(); }}>
                <Input type="number" min="1" step="0.01" placeholder="Enter your bid ($)" value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                <Button type="submit" className="comic-button" disabled={submitting}>{submitting ? "Submitting..." : "Place Bid"}</Button>
                <div className="text-xs text-muted-foreground">All bids are hidden until the auction ends.</div>
              </form>
            ) : (
              <div>
                <div className="font-bold mb-2">Auction ended.</div>
                {auction.bids && auction.bids.length > 0 ? (
                  <div>
                    <div className="mb-2">Bids:</div>
                    <ul className="mb-2">
                      {auction.bids.map((bid: { id: string; amount: number }, idx: number) => (
                        <li key={bid.id} className={idx === 0 ? "font-bold text-green-600" : ""}>
                          ${bid.amount.toFixed(2)} {idx === 0 ? "(Winner)" : ""}
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-muted-foreground">Highest bid wins. Winner will be charged automatically.</div>
                  </div>
                ) : (
                  <div>No bids were placed.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
