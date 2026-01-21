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
  // add other fields as needed
};

export default function BlindBidderIndexPage() {
  const CATEGORY_OPTIONS = [
    { value: "ALL", label: "All Categories" },
    { value: "COMIC_BOOKS", label: "Comic Books" },
    { value: "SPORTS_CARDS", label: "Sports Cards" },
    { value: "POKEMON_CARDS", label: "Pokémon Cards" },
    { value: "VIDEO_GAMES", label: "Video Games" },
    { value: "TOYS", label: "Toys" },
    { value: "OTHER", label: "Other" },
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
        <div className="mb-6 flex flex-col gap-3">
          <div className="w-full flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search auctions..."
              className={`border-2 rounded px-3 py-2 w-full text-lg bg-white text-black focus:outline-none focus:ring-2 ${styles.searchInput}`}
            />
            <button
              type="button"
              onClick={() => {}}
              className="px-4 py-2 font-bold rounded bg-[#00dde5] text-black border-2 border-[#00dde5] hover:bg-[#00c2c2] transition minWidthButton"
            >
              Search
            </button>
          </div>
          <div className="flex gap-2 items-center w-full">
            <label htmlFor="categoryFilter" className="sr-only">Category</label>
            <select
              id="categoryFilter"
              aria-label="Category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border rounded px-2 py-1 bg-white text-black custom-select"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label htmlFor="sortBy" className="sr-only">Sort By</label>
            <select
              id="sortBy"
              aria-label="Sort By"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border rounded px-2 py-1 bg-white text-black custom-select"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button asChild className="text-white border transition blind-bidder-add-btn">
              <Link href="/blind-bidder/create">Add Blind Bidder Listing</Link>
            </Button>
          </div>
        </div>
        {loading ? <div>Loading auctions…</div> : auctions.length === 0 ? (
          <div className="text-muted-foreground">No open Blind Bidder auctions right now.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {auctions.map(a => (
              <BlindBidderCard key={a.id} auction={a} />
            ))}
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
