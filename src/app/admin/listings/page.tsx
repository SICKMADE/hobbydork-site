"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";


type Listing = {
  id: string;
  title?: string;
  status?: string;
  state?: string;
  removedBy?: string | null;
  removedReason?: string | null;
};

export default function AdminListingsPage() {
  const { userData } = useAuth();
  const role = userData?.role;
  const isStaff = role === "ADMIN" || role === "MODERATOR";

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isStaff || !db) {
        setLoading(false);
        return;
      }
      // Enforce check at call site
      const snap = await getDocs(collection(db, "listings"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
      setItems(data);
      setLoading(false);
    }
    load();
  }, [isStaff, db]);

  async function remove(id: string) {
    if (!db || !isStaff) {
      alert("You do not have permission to remove listings.");
      return;
    }
    const reason = prompt("Reason for removal:");
    // Enforce check at call site
    if (!isStaff) return;
    await updateDoc(doc(db, "listings", id), {
      status: "REMOVED",
      state: "HIDDEN",
      removedBy: "ADMIN_PANEL",
      removedReason: reason || "Violation",
      updatedAt: serverTimestamp(),
    });
  }

  async function restore(id: string) {
    if (!db) {
      alert("Database unavailable. Could not restore listing.");
      return;
    }
    await updateDoc(doc(db, "listings", id), {
      status: "ACTIVE",
      state: "ACTIVE",
      removedBy: null,
      removedReason: null,
      updatedAt: serverTimestamp(),
    });
  }

  if (!isStaff) return <div className="p-6">You do not have access.</div>;
  if (loading) return <div className="p-6">Loading listings</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Listing Moderation</h1>

      {items.map((l) => (
        (() => {
          const isRemoved = l.status === "REMOVED" || l.state === "HIDDEN";
          const displayStatus = l.status ?? l.state;

          return (
        <div key={l.id} className="border p-4 rounded bg-white shadow space-y-2">
          <p className="font-semibold">{l.title}</p>
          <p>Status: {displayStatus}</p>

          {l.removedReason && (
            <p className="text-sm text-red-600">Reason: {l.removedReason}</p>
          )}

          <div className="flex gap-2">
            {!isRemoved && (
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={() => remove(l.id)}
              >
                Remove
              </button>
            )}
            {isRemoved && (
              <button
                className="px-3 py-1 bg-green-600 text-white rounded"
                onClick={() => restore(l.id)}
              >
                Restore
              </button>
            )}
          </div>
        </div>
          );
        })()
      ))}
    </div>
  );
}
