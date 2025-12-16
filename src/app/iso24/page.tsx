"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function AdminISO24Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "iso24"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
      setLoading(false);
    }
    load();
  }, []);

  async function remove(id: string) {
    const reason = prompt("Reason for removal:");
    await updateDoc(doc(db, "iso24", id), {
      status: "REMOVED",
      removedBy: "ADMIN_PANEL",
      removedReason: reason || "Violation",
      updatedAt: serverTimestamp(),
    });
  }

  async function restore(id: string) {
    await updateDoc(doc(db, "iso24", id), {
      status: "ACTIVE",
      removedBy: null,
      removedReason: null,
      updatedAt: serverTimestamp(),
    });
  }

  if (loading) return <div className="p-6">Loading ISO-24 posts…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">ISO-24 Moderation</h1>

      {items.map((post) => (
        <div
          key={post.id}
          className="border p-4 bg-white rounded shadow space-y-2"
        >
          <p className="font-semibold">{post.title || "ISO Post"}</p>
          <p>Status: {post.status}</p>

          {post.removedReason && (
            <p className="text-sm text-red-600">Reason: {post.removedReason}</p>
          )}

          <div className="flex gap-2">
            {post.status !== "REMOVED" && (
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={() => remove(post.id)}
              >
                Remove
              </button>
            )}

            {post.status === "REMOVED" && (
              <button
                className="px-3 py-1 bg-green-600 text-white rounded"
                onClick={() => restore(post.id)}
              >
                Restore
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
