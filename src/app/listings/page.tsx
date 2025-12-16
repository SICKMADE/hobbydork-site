"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ListingsSearchPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  async function loadListings() {
    setLoading(true);

    let q = query(collection(db, "listings"), where("status", "==", "ACTIVE"));

    const allSnap = await getDocs(q);
    let data = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-bold">Marketplace</h1>

      {/* FILTERS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

        <Input
          placeholder="Search title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Input
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          type="number"
        />

        <Input
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          type="number"
        />

        <select
          className="border rounded p-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="low">Price: Low → High</option>
          <option value="high">Price: High → Low</option>
        </select>
      </div>

      <Button onClick={loadListings}>Apply Filters</Button>

      {/* LISTINGS */}
      {loading ? (
        <div>Loading…</div>
      ) : listings.length === 0 ? (
        <div>No results.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`}>
              <div className="border rounded bg-white p-2 shadow hover:shadow-md transition cursor-pointer">
                <img
                  src={l.images?.[0]}
                  className="w-full h-40 object-cover rounded"
                />
                <p className="mt-2 font-semibold">{l.title}</p>
                <p className="text-gray-700">${l.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
