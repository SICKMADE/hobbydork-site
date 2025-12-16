"use client";

import { useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";

export default function AdminUserSearchPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    if (!term.trim()) return;

    setLoading(true);
    let matches: any[] = [];

    const fields = ["email", "uid", "displayName", "storeId", "stripeAccountId"];

    for (const field of fields) {
      const q = query(
        collection(db, "users"),
        where(field, "==", term.trim())
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        snap.docs.forEach((d) => matches.push({ id: d.id, ...d.data() }));
      }
    }

    setResults(matches);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Search</h1>

      {/* SEARCH BAR */}
      <div className="flex gap-2">
        <input
          className="border p-2 rounded w-full"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search email, UID, display name, storeId, Stripe ID…"
        />
        <button
          onClick={runSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Search
        </button>
      </div>

      {loading && <p>Searching…</p>}

      {/* RESULTS */}
      <div className="space-y-4">
        {results.map((u) => (
          <div
            key={u.id}
            className="border p-4 bg-white rounded shadow space-y-2"
          >
            <p className="font-semibold text-lg">
              {u.role === "ADMIN" && "👑 "}
              {u.role === "MODERATOR" && "🛡️ "}
              {u.displayName}
            </p>

            <p>Email: {u.email}</p>
            <p>UID: {u.uid}</p>
            <p>Store ID: {u.storeId}</p>
            <p>Role: {u.role}</p>
            <p>Status: {u.status}</p>

            <div className="flex gap-2 mt-2">

              {/* VIEW STORE */}
              <Link href={`/store/${u.storeId}`}>
                <button className="px-3 py-1 bg-gray-700 text-white rounded">
                  View Store
                </button>
              </Link>

              {/* GO TO ADMIN USER PAGE (moderation tools) */}
              <Link href={`/admin/users`}>
                <button className="px-3 py-1 bg-blue-700 text-white rounded">
                  Open in User Manager
                </button>
              </Link>

              {/* SEND MESSAGE */}
              <Link
                href={`/messages/${[u.uid, u.uid].join("_")}`} // replaced by actual function in your app
              >
                <button className="px-3 py-1 bg-green-600 text-white rounded">
                  Send Message
                </button>
              </Link>
            </div>
          </div>
        ))}

        {results.length === 0 && !loading && term !== "" && (
          <p className="text-gray-600">No users found.</p>
        )}
      </div>
    </div>
  );
}
