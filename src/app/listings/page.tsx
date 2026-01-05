"use client";

import { useEffect, useState } from "react";
import type { Listing } from '@/lib/types';
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import ListingCard from "@/components/ListingCard";

export default function ListingsSearchPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  async function loadListings() {
    setLoading(true);

    // Strict Firestore read gate
    // TODO: Replace with your actual canReadFirestore logic
    const canReadFirestore = true; // Set to false if not allowed
    if (!canReadFirestore) {
      setLoading(false);
      return;
    }

    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db!, "listings"), where("state", "==", "ACTIVE"));

    const allSnap = await getDocs(q);
    let data = allSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Listing[];

    // search
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter((l) => l.title.toLowerCase().includes(s));
    }

    // category
    if (category.trim() !== "") {
      data = data.filter((l) => l.category === category);
    }

    // price min/max
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Infinity;

    data = data.filter((l) => l.price >= min && l.price <= max);

    // sort
    if (sortBy === "newest") {
      data = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } else if (sortBy === "low") {
      data = data.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high") {
      data = data.sort((a, b) => b.price - a.price);
    }

    setListings(data);
    setLoading(false);
  }

  useEffect(() => {
    loadListings();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Marketplace</h1>
          <Button onClick={loadListings} size="sm" className="comic-button">
            Apply Filters
          </Button>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input
            placeholder="Search title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="comic-input-field"
          />

          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="comic-input-field"
          />

          <Input
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            type="number"
            className="comic-input-field"
          />

          <Input
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            className="comic-input-field"
          />

          <label htmlFor="sortBy" className="sr-only">Sort by</label>
          <select
            id="sortBy"
            className="h-10 w-full rounded-md border-2 border-black bg-background px-3 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort by"
          >
            <option value="newest">Newest</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>

        {/* LISTINGS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Spinner size={64} />
            <div className="mt-4 text-muted-foreground">Loading listings...</div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-muted-foreground">No results.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
