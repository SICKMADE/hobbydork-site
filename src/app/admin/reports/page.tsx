"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/firebase/client-provider";
import type { Firestore } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";


type Report = {
  id: string;
  context: string;
  reason: string;
  details?: string;
  reporterUid: string;
  targetUid: string;
  messageId?: string;
  listingId?: string;
  isoId?: string;
  createdAt?: { toDate: () => Date };
  resolved?: boolean;
};

export default function AdminReportsPage() {
  const { userData } = useAuth();
  const [reports, setReports] = useState<Report[]>([] as Report[]);
  const [filter, setFilter] = useState("ALL");

  const role = userData?.role;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";
  const isStaff = isAdmin || isModerator;

  const dbSafe = db as Firestore;
  const reportsQuery = useMemo(() => {
    if (!isStaff) return null;
    return query(collection(dbSafe, "reports"), orderBy("createdAt", "desc"));
  }, [dbSafe, isStaff]);

  useEffect(() => {
    if (!reportsQuery) return;
    const unsub = onSnapshot(reportsQuery, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report));
    });
    return () => unsub();
  }, [reportsQuery]);

  if (!isStaff)
    return <div className="p-6">You do not have access.</div>;

  const filtered = reports.filter((r) => {
    if (filter === "ALL") return true;
    return r.context === filter;
  });

  async function resolveReport(id: string) {
    const dbSafe = db as Firestore;
    await updateDoc(doc(dbSafe, "reports", id), {
      resolved: true,
      resolvedAt: new Date(),
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <h1 className="text-3xl font-bold">Moderation Reports</h1>

      {/* FILTERS */}
      <div className="flex gap-3 text-sm">
        {["ALL", "seller", "listing", "iso24", "livechat", "dm"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded border ${
              filter === f ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            {f === "ALL" ? "All Reports" : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* REPORT LIST */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            className={`border p-4 rounded shadow bg-white ${
              r.resolved ? "opacity-50" : ""
            }`}
          >
            <p className="font-semibold text-lg mb-1">
              {r.context.toUpperCase()} Report
            </p>

            <p className="text-sm"><strong>Reason:</strong> {r.reason}</p>
            {r.details && (
              <p className="text-sm"><strong>Details:</strong> {r.details}</p>
            )}

            <p className="text-sm">
              <strong>Reporter:</strong> {r.reporterUid}
            </p>
            <p className="text-sm">
              <strong>Target:</strong> {r.targetUid}
            </p>

            {/* CONTEXT-SPECIFIC */}
            {r.messageId && (
              <p className="text-sm"><strong>Message ID:</strong> {r.messageId}</p>
            )}

            {r.listingId && (
              <p className="text-sm">
                <strong>Listing:</strong>{" "}
                <a
                  href={`/listings/${r.listingId}`}
                  className="text-blue-600 underline"
                >
                  View Listing
                </a>
              </p>
            )}

            {r.isoId && (
              <p className="text-sm">
                <strong>ISO Post:</strong> {r.isoId}
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              {r.createdAt?.toDate().toLocaleString()}
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mt-3">

              {/* VIEW STORE */}
              <a
                href={`/store/${r.targetUid}`}
                className="px-3 py-2 border rounded bg-gray-100"
              >
                View Store
              </a>

              {/* DM USER */}
              <a
                href={`/messages/${r.targetUid}`}
                className="px-3 py-2 border rounded bg-gray-100"
              >
                Message User
              </a>

              {/* ADMIN ACTIONS */}
              {isAdmin && (
                <a
                  href={`/admin/users`}
                  className="px-3 py-2 border rounded bg-red-200 text-red-800"
                >
                  Open User Manager
                </a>
              )}

              {/* MARK RESOLVED */}
              {!r.resolved && (
                <button
                  onClick={() => resolveReport(r.id)}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
