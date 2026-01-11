"use client";


import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/client-provider";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function exportCSV(data: any[]) {
  const header = ["UID", "Email", "Display Name", "Stripe Account", "Approved At", "Reviewed", "Admin Note"];
  const rows = data.map(a => [a.uid, a.email, a.displayName, a.stripeAccountId, a.approvedAt?.toDate?.().toLocaleString?.() || String(a.approvedAt), a.reviewed ? "Yes" : "No", a.adminNote || ""]);
  const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seller-approvals.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SellerApprovalsAdmin() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [noteEdit, setNoteEdit] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    // Live updates with onSnapshot
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "sellerApprovals"), orderBy("approvedAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setApprovals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Search and filter
  const filtered = useMemo(() => {
    let data = approvals;
    if (!showAll) data = data.filter(a => !a.reviewed);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(a =>
        (a.email || "").toLowerCase().includes(s) ||
        (a.displayName || "").toLowerCase().includes(s) ||
        (a.uid || "").toLowerCase().includes(s)
      );
    }
    return data;
  }, [approvals, search, showAll]);

  // Mark as reviewed
  const markReviewed = async (id: string) => {
    if (!db) {
      alert("Database unavailable. Could not mark as reviewed.");
      return;
    }
    await updateDoc(doc(db, "sellerApprovals", id), { reviewed: true });
  };

  // Save admin note
  const saveNote = async (id: string) => {
    if (!db) {
      alert("Database unavailable. Could not save note.");
      return;
    }
    await updateDoc(doc(db, "sellerApprovals", id), { adminNote: noteEdit[id] || "" });
    setNoteEdit(e => {
      const copy = { ...e };
      delete copy[id];
      return copy;
    });
  };

  // Pagination (simple, client-side)
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.ceil(filtered.length / pageSize);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">New Seller Approvals</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
          <input
            className="border rounded px-2 py-1 w-full sm:w-64"
            placeholder="Search email, name, or UID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={() => setShowAll(v => !v)}>{showAll ? "Hide Reviewed" : "Show All"}</Button>
          <Button variant="outline" onClick={() => exportCSV(filtered)}>Export CSV</Button>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground">No new sellers found.</div>
        ) : (
          <div className="space-y-4">
            {paged.map(a => (
              <Card key={a.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {a.displayName || a.email || a.uid}
                    {a.reviewed ? (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-200 text-green-800">Reviewed</span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800">New</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-sm text-muted-foreground">UID: <span className="font-mono">{a.uid}</span></div>
                  <div className="text-sm text-muted-foreground">Email: {a.email}</div>
                  <div className="text-sm text-muted-foreground">Stripe Account: {a.stripeAccountId}</div>
                  <div className="text-sm text-muted-foreground">Approved: {a.approvedAt?.toDate?.().toLocaleString?.() || String(a.approvedAt)}</div>
                  <div className="text-sm text-muted-foreground">Admin Note:</div>
                  <label htmlFor={`admin-note-${a.id}`} className="sr-only">Admin Note</label>
                  <textarea
                    id={`admin-note-${a.id}`}
                    className="w-full border rounded p-1 text-sm"
                    value={noteEdit[a.id] !== undefined ? noteEdit[a.id] : (a.adminNote || "")}
                    onChange={e => setNoteEdit(n => ({ ...n, [a.id]: e.target.value }))}
                    rows={2}
                    placeholder="Enter admin note..."
                  />
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" onClick={() => saveNote(a.id)}>Save Note</Button>
                    {!a.reviewed && <Button size="sm" variant="outline" onClick={() => markReviewed(a.id)}>Mark Reviewed</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Pagination controls */}
            {pageCount > 1 && (
              <div className="flex gap-2 justify-center mt-4">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm">Page {page + 1} of {pageCount}</span>
                <Button size="sm" variant="outline" disabled={page === pageCount - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
