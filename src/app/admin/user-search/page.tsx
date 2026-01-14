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
import { useAuth } from "@/hooks/use-auth";


type User = {
  id: string;
  email?: string;
  uid?: string;
  displayName?: string;
  storeId?: string;
  stripeAccountId?: string;
  role?: string;
  status?: string;
};

export default function AdminUserSearchPage() {
  const { profile } = useAuth();
  const role = profile?.role;
  const isAdmin = role === "ADMIN" && profile?.status === "ACTIVE";
  const isStaff = (isAdmin || role === "MODERATOR") && profile?.status === "ACTIVE";

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isStaff) {
    return <div className="p-6">You do not have access.</div>;
  }

  async function runSearch() {
    // Strict Firestore read gate
    const canReadFirestore = isStaff;
    if (!term.trim() || !canReadFirestore) return;

    setLoading(true);
    const matches: User[] = [];

    const fields = ["email", "uid", "displayName", "storeId", "stripeAccountId"];

    for (const field of fields) {
      if (!db) continue;
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
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">User Search</h1>

      {/* SEARCH BAR */}
      <div className="flex gap-2">
        <input
          className="border-2 border-primary bg-card/80 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search email, UID, display name, storeId, Stripe ID…"
        />
        <button
          onClick={runSearch}
          className="comic-button bg-blue-600 border-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
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
            className="rounded-2xl border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)] p-5 space-y-2"
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
                <button className="comic-button bg-gray-700 border-gray-700 text-white hover:bg-gray-800 px-3 py-1 rounded">
                  View Store
                </button>
              </Link>

              {/* GO TO ADMIN USER PAGE (moderation tools) */}
              {isAdmin && (
                <Link href={`/admin/users`}>
                  <button className="comic-button bg-blue-700 border-blue-700 text-white hover:bg-blue-800 px-3 py-1 rounded">
                    Open in User Manager
                  </button>
                </Link>
              )}

              {/* SEND MESSAGE */}
              <Link
                href={`/messages/${[u.uid, u.uid].join("_")}`}
              >
                <button className="comic-button bg-green-600 border-green-600 text-white hover:bg-green-700 px-3 py-1 rounded">
                  Send Message
                </button>
              </Link>
            </div>
          </div>
        ))}

        {results.length === 0 && !loading && term !== "" && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="text-4xl mb-2">🙍‍♂️</div>
            <div className="font-semibold mb-1">No users found</div>
            <div className="mb-2 text-sm">Try a different search term or check your spelling.</div>
          </div>
        )}
      </div>
    </div>
  );
}
