"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DigitalCountdownClock } from "@/components/blind-bidder/DigitalCountdownClock";
import BlindBidderCard from '@/components/blind-bidder/BlindBidderCard';
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/client-provider";
import styles from "./[auctionId]/page.module.css";
import AppLayout from '@/components/layout/AppLayout';

type Auction = {
  id: string;
  title: string;
  description: string;
  endsAt: { seconds: number } | number;
  createdAt: { seconds: number } | number;
  sellerUid: string;
  category?: string;
  sellerName?: string;
  sellerAvatar?: string;
  primaryImageUrl?: string;
  imageUrl?: string;
  // add other fields as needed
};

export default function BlindBidderIndexPage() {
  const [previewAuction, setPreviewAuction] = useState<Auction|null>(null);
  const CATEGORY_OPTIONS = [
    { value: "ALL", label: "All Categories", icon: "🌐" },
    { value: "COMIC_BOOKS", label: "Comic Books", icon: "📚" },
    { value: "SPORTS_CARDS", label: "Sports Cards", icon: "🏅" },
    { value: "POKEMON_CARDS", label: "Pokémon Cards", icon: "⚡" },
    { value: "VIDEO_GAMES", label: "Video Games", icon: "🎮" },
    { value: "TOYS", label: "Toys", icon: "🧸" },
    { value: "OTHER", label: "Other", icon: "✨" },
  ];
  const SORT_OPTIONS = [
    { value: "ending", label: "Ending Soonest" },
    { value: "newest", label: "Newly Listed" },
  ];
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("ending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAuctions() {
      if (!db) {
        setLoading(false);
        return;
      }
      let q = query(
        collection(db, "blindBidAuctions"),
        where("status", "==", "OPEN")
      );
      const snap = await getDocs(q);
      let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Auction));
      // Filter by category
      if (categoryFilter !== "ALL") {
        items = items.filter(a => a.category === categoryFilter);
      }
      // Filter by search
      if (search.trim() !== "") {
        const s = search.toLowerCase();
        items = items.filter(a =>
          (a.title?.toLowerCase().includes(s) || a.description?.toLowerCase().includes(s))
        );
      }
      // Sort
      if (sortBy === "ending") {
        items = items.sort((a, b) => {
          const aEnd = typeof a.endsAt === "object" && a.endsAt !== null && "seconds" in a.endsAt
            ? (a.endsAt as { seconds: number }).seconds
            : (typeof a.endsAt === "number" ? a.endsAt : 0);
          const bEnd = typeof b.endsAt === "object" && b.endsAt !== null && "seconds" in b.endsAt
            ? (b.endsAt as { seconds: number }).seconds
            : (typeof b.endsAt === "number" ? b.endsAt : 0);
          return aEnd - bEnd;
        });
      } else if (sortBy === "newest") {
        items = items.sort((a, b) => {
          const aStart = typeof a.createdAt === "object" && a.createdAt !== null && "seconds" in a.createdAt
            ? (a.createdAt as { seconds: number }).seconds
            : (typeof a.createdAt === "number" ? a.createdAt : 0);
          const bStart = typeof b.createdAt === "object" && b.createdAt !== null && "seconds" in b.createdAt
            ? (b.createdAt as { seconds: number }).seconds
            : (typeof b.createdAt === "number" ? b.createdAt : 0);
          return bStart - aStart;
        });
      }

      // Fetch seller info for all unique sellerUids
      const uniqueSellerUids = Array.from(new Set(items.map(a => a.sellerUid)));
      let sellerInfoMap: Record<string, { displayName?: string; avatar?: string }> = {};
      if (uniqueSellerUids.length > 0) {
        // Firestore only allows 10 in 'in' queries, so batch if needed
        const batches = [];
        for (let i = 0; i < uniqueSellerUids.length; i += 10) {
          batches.push(uniqueSellerUids.slice(i, i + 10));
        }
        for (const batch of batches) {
          const qUsers = query(collection(db, "users"), where("uid", "in", batch));
          const snapUsers = await getDocs(qUsers);
          snapUsers.forEach(doc => {
            const data = doc.data();
            sellerInfoMap[data.uid] = {
              displayName: data.displayName || undefined,
              avatar: data.avatar || data.photoURL || undefined,
            };
          });
        }
      }
      // Map seller info onto auctions
      items = items.map(a => ({
        ...a,
        sellerName: sellerInfoMap[a.sellerUid]?.displayName ?? undefined,
        sellerAvatar: sellerInfoMap[a.sellerUid]?.avatar ?? undefined,
      }));

      setAuctions(items);
      setLoading(false);
    }
    fetchAuctions();
  }, [categoryFilter, sortBy, search]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center mb-6">
          <img src="/BLIND.png" alt="Blind Bidder" className="h-20 md:h-28" />
        </div>
        {/* FILTERS */}
        <div className="mb-6">
          <div className="sticky top-2 z-30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 p-5 rounded-2xl border-2 border-black shadow-xl backdrop-blur-md">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search auctions..."
              className="comic-input-field border-2 border-black focus:ring-2 focus:ring-primary bg-white/80"
            />
            <select
              id="categoryFilter"
              aria-label="Category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-md border-2 border-black bg-muted/40 px-3 text-sm font-semibold"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
              ))}
            </select>
            <div className="col-span-2 flex items-center justify-center">
              <Button asChild className="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white border-2 border-black shadow">
                <Link href="/blind-bidder/create">Add Blind Bidder Listing</Link>
              </Button>
            </div>
            <select
              id="sortBy"
              aria-label="Sort By"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="h-10 w-full rounded-md border-2 border-black bg-muted/40 px-3 text-sm font-semibold"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-label="Loading auctions">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col h-full animate-fade-in-slow">
                <div className="w-full aspect-[4/5] bg-gray-200 rounded-md mb-3" />
                <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-1" />
                <div className="flex gap-2 mt-auto">
                  <div className="h-6 w-12 rounded-full bg-gray-200" />
                  <div className="h-6 w-16 rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[260px] text-center text-muted-foreground animate-fade-in-slow">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 animate-bounce-slow">
              <ellipse cx="60" cy="60" rx="50" ry="50" fill="#f3f3f3" stroke="#d1d5db" strokeWidth="4" />
              <ellipse cx="60" cy="80" rx="18" ry="8" fill="#e5e7eb" />
              <circle cx="45" cy="55" r="8" fill="#d1d5db" />
              <circle cx="75" cy="55" r="8" fill="#d1d5db" />
              <rect x="40" y="70" width="40" height="8" rx="4" fill="#e5e7eb" />
              <rect x="85" y="85" width="18" height="6" rx="3" fill="#d1d5db" transform="rotate(30 85 85)" />
              <rect x="17" y="85" width="18" height="6" rx="3" fill="#d1d5db" transform="rotate(-30 17 85)" />
              <ellipse cx="60" cy="60" rx="50" ry="50" fill="#fff" fillOpacity="0.1" />
              <path d="M50 90 Q60 100 70 90" stroke="#d1d5db" strokeWidth="2" fill="none" />
            </svg>
            <div className="font-semibold mb-1 text-lg">No Blind Bidder auctions found</div>
            <div className="mb-2 text-sm">Check back soon or <a href="/blind-bidder/create" className="underline hover:text-primary">list your own auction</a>!</div>
            <a href="/blind-bidder/create" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition mt-2">List an auction</a>
            {/* ...removed duplicate style jsx... */}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" role="list" aria-label="Blind Bidder auctions grid">
              {auctions.map((a, idx) => (
                <div
                  key={a.id}
                  onClick={() => setPreviewAuction(a)}
                  className={`cursor-pointer focus:outline focus:outline-2 focus:outline-primary transition-all duration-500 blind-bidder-card-delay delay-${idx}`}
                  tabIndex={0}
                  role="listitem"
                  aria-label={`Preview ${a.title}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPreviewAuction(a); }}
                >
                  <BlindBidderCard auction={a} sellerName={a.sellerName} sellerAvatar={a.sellerAvatar} />
                </div>
              ))}
            </div>
            {/* Quick Preview Modal */}
            {previewAuction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label={previewAuction.title}>
                <div className="bg-white rounded-xl p-6 w-[95vw] max-w-lg border-2 border-black shadow-xl relative animate-fade-in-slow">
                  <button className="absolute top-2 right-2 text-lg font-bold" onClick={() => setPreviewAuction(null)} aria-label="Close Preview">×</button>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0 w-full md:w-1/2 flex items-center justify-center">
                      {previewAuction.primaryImageUrl || previewAuction.imageUrl ? (
                        <img src={previewAuction.primaryImageUrl || previewAuction.imageUrl} alt={previewAuction.title} className="rounded-lg max-h-60 object-contain w-full" />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500">No image</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{previewAuction.title}</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-zinc-800 text-white px-2 py-1 rounded">{previewAuction.category}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">{previewAuction.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {previewAuction.sellerAvatar ? (
                          <img src={previewAuction.sellerAvatar} alt={previewAuction.sellerName ?? 'Unknown Seller'} className="w-7 h-7 rounded-full border border-black" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-300 border border-black flex items-center justify-center text-xs">?</div>
                        )}
                        <span className="text-xs font-semibold">{previewAuction.sellerName ?? 'Unknown Seller'}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <a href={`/blind-bidder/${previewAuction.id}`} className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">View &amp; Bid</a>
                        <button className="comic-button px-4 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-800 transition" onClick={() => setPreviewAuction(null)}>Close</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* ...existing code... */}
          </div>
        )}
      </div>
      <style jsx>{`
        .blind-bidder-add-btn {
          background-color: #9f9f9f;
          border-color: #888;
          color: #fff;
        }
        .blind-bidder-add-btn:hover {
          background-color: #888;
        }
      `}</style>
    </AppLayout>
  );
}
