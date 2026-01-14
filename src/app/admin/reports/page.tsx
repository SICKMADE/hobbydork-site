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

// Report type
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

const FILTERS = [
  { key: "ALL", label: "All Reports" },
  { key: "seller", label: "Seller" },
  { key: "listing", label: "Listing" },
  { key: "iso24", label: "ISO24" },
  { key: "livechat", label: "Livechat" },
  { key: "dm", label: "DM" },
];

export default function AdminReportsPage() {
  const { userData } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
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

  if (!isStaff) {
    return (
      <div className="p-8 text-center text-lg text-destructive font-bold">You do not have access.</div>
    );
  }

  const filtered = reports.filter((r) =>
    filter === "ALL" ? true : r.context === filter
  );

  async function resolveReport(id: string) {
    const ref = doc(dbSafe, "reports", id);
    await updateDoc(ref, { resolved: true });
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8 space-y-8">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Moderation Reports</h1>
        <p className="text-base text-muted-foreground mt-1">Review and resolve user reports</p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm justify-center mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full border-2 font-bold transition-colors duration-150
              ${filter === f.key ? "bg-primary text-white border-primary shadow" : "bg-card/80 border-muted text-muted-foreground hover:bg-primary/10"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 018 0v2m-4-4a4 4 0 100-8 4 4 0 000 8zm-6 8a9 9 0 1118 0H3z" />
            </svg>
            <div className="text-lg font-semibold text-muted-foreground">No reports found</div>
            <div className="text-sm text-muted-foreground mt-1">All clear! No users or content have been reported.</div>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)] p-5 flex flex-col gap-2 ${r.resolved ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded bg-muted/60 border border-primary text-primary">
                  {r.context.toUpperCase()}
                </span>
                {r.resolved && <span className="ml-2 text-xs text-green-600 font-bold">RESOLVED</span>}
              </div>
              <div className="text-base font-bold text-destructive">{r.reason}</div>
              {r.details && (
                <div className="text-sm text-muted-foreground"><strong>Details:</strong> {r.details}</div>
              )}
              <div className="text-xs text-muted-foreground">
                <strong>Reporter:</strong> {r.reporterUid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Target:</strong> {r.targetUid}
              </div>
              {r.messageId && (
                <div className="text-xs text-muted-foreground"><strong>Message ID:</strong> {r.messageId}</div>
              )}
              {r.listingId && (
                <div className="text-xs text-muted-foreground">
                  <strong>Listing:</strong>{" "}
                  <a href={`/listings/${r.listingId}`} className="text-primary underline font-bold">View Listing</a>
                </div>
              )}
              {r.isoId && (
                <div className="text-xs text-muted-foreground"><strong>ISO Post:</strong> {r.isoId}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {r.createdAt?.toDate().toLocaleString()}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <a
                  href={`/store/${r.targetUid}`}
                  className="comic-button px-3 py-2 text-xs"
                >
                  View Store
                </a>
                <a
                  href={`/messages/${r.targetUid}`}
                  className="comic-button px-3 py-2 text-xs"
                >
                  Message User
                </a>
                {isAdmin && (
                  <a
                    href={`/admin/users`}
                    className="comic-button px-3 py-2 text-xs bg-red-600 text-white border-red-600 hover:bg-red-700"
                  >
                    Open User Manager
                  </a>
                )}
                {!r.resolved && (
                  <button
                    onClick={() => resolveReport(r.id)}
                    className="comic-button px-3 py-2 text-xs bg-green-600 text-white border-green-600 hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

