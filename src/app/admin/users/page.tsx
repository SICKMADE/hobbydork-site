"use client";

import { useState } from "react";
import { useEffect } from "react";
import { db } from "@/firebase/client-provider";
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const { userData } = useAuth();

  type User = {
    id: string;
    displayName?: string;
    email?: string;
    role?: string;
    status?: string;
    suspendUntil?: { toDate: () => Date } | null;
    sellerFeePercent?: number;
    sellerTier?: "BRONZE" | "SILVER" | "GOLD";
  };

  type TierChange = {
    id: string;
    changedBy: string | null;
    changedByEmail: string | null;
    newTier: string;
    reason: string;
    changedAt: { toDate: () => Date };
    type: string;
  };

  // Store audit logs for each user by uid
  const [tierLogs, setTierLogs] = useState<{ [uid: string]: TierChange[] }>({});
  const [logOpen, setLogOpen] = useState<{ [uid: string]: boolean }>({});

  // Fetch audit log for a user
  async function fetchTierLog(uid: string) {
    if (!db) return;
    const snap = await (await import("firebase/firestore")).getDocs(
      (await import("firebase/firestore")).collection(db, "users", uid, "tierChanges")
    );
    const logs: TierChange[] = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      logs.push({
        id: docSnap.id,
        changedBy: d.changedBy || null,
        changedByEmail: d.changedByEmail || null,
        newTier: d.newTier,
        reason: d.reason || "",
        changedAt: d.changedAt,
        type: d.type || "manual"
      });
    });
    // Sort newest first, handle missing or invalid changedAt
    logs.sort((a, b) => {
      const aTime = (a.changedAt && typeof a.changedAt.toDate === 'function') ? a.changedAt.toDate().getTime() : 0;
      const bTime = (b.changedAt && typeof b.changedAt.toDate === 'function') ? b.changedAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
    setTierLogs(prev => ({ ...prev, [uid]: logs }));
  }
  const [tierEdit, setTierEdit] = useState<{ [uid: string]: string }>({});
  const [tierLoading, setTierLoading] = useState<{ [uid: string]: boolean }>({});
  const [tierReason, setTierReason] = useState<{ [uid: string]: string }>({});

  // Admin can update seller tier directly
  async function updateSellerTier(uid: string, tier: "BRONZE" | "SILVER" | "GOLD") {
    if (!db || userData?.role !== "ADMIN") throw new Error('You do not have permission.');
    setTierLoading((prev) => ({ ...prev, [uid]: true }));
    await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
      sellerTier: tier,
      updatedAt: serverTimestamp(),
    });
    // Add audit log entry
    const reason = tierReason[uid] || "";
    await addDoc(collection(db as import('firebase/firestore').Firestore, "users", uid, "tierChanges"), {
      changedBy: userData?.uid || null,
      changedByEmail: userData?.email || null,
      newTier: tier,
      reason,
      changedAt: serverTimestamp(),
      type: "manual"
    });
    setTierLoading((prev) => ({ ...prev, [uid]: false }));
    setTierEdit((prev) => ({ ...prev, [uid]: "" }));
    setTierReason((prev) => ({ ...prev, [uid]: "" }));
    // Optionally refresh users list here
  }

  const [users, setUsers] = useState<User[]>([]);
  const [feeEdit, setFeeEdit] = useState<{ [uid: string]: string }>({});
  const [feeLoading, setFeeLoading] = useState<{ [uid: string]: boolean }>({});
    // Update seller fee percent
    async function updateSellerFee(uid: string, percent: number) {
      if (!db || userData?.role !== "ADMIN") throw new Error('You do not have permission.');
      setFeeLoading((prev) => ({ ...prev, [uid]: true }));
      await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
        sellerFeePercent: percent,
        updatedAt: serverTimestamp(),
      });
      setFeeLoading((prev) => ({ ...prev, [uid]: false }));
      setFeeEdit((prev) => ({ ...prev, [uid]: "" }));
      // Optionally refresh users list here
    }
  const [loading] = useState(false); // Remove setLoading as it's unused

  if (userData?.role !== "ADMIN") {
    return <div className="p-6">You do not have access.</div>;
  }
  if (loading) return <div className="p-6">Loading…</div>;

  // SUSPEND
  async function suspend(uid: string, hours: number) {
    if (!db || userData?.role !== "ADMIN") throw new Error('You do not have permission.');
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    // Enforce check at call site
    if (userData?.role !== "ADMIN") return;
    await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
      status: "SUSPENDED",
      suspendUntil: until,
      updatedAt: serverTimestamp(),
    });
  }

  // BAN
  async function ban(uid: string) {
    if (!db || userData?.role !== "ADMIN") throw new Error('You do not have permission.');
    // Enforce check at call site
    if (userData?.role !== "ADMIN") return;
    await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
      status: "BANNED",
      suspendUntil: null,
      updatedAt: serverTimestamp(),
    });
  }

  // RESTORE
  async function restore(uid: string) {
    if (!db || userData?.role !== "ADMIN") throw new Error('You do not have permission.');
    // Enforce check at call site
    if (userData?.role !== "ADMIN") return;
    await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
      status: "ACTIVE",
      suspendUntil: null,
      updatedAt: serverTimestamp(),
    });
  }

  // PROMOTE MODERATOR
  async function promoteToModerator(uid: string) {
    if (!db) throw new Error('Firestore is not initialized.');
    await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
      role: "MODERATOR",
      updatedAt: serverTimestamp(),
    });
  }

  // DEMOTE MODERATOR
  async function removeModerator(uid: string) {
    if (!db) throw new Error('Firestore is not initialized.');
    await updateDoc(doc(db as import('firebase/firestore').Firestore, "users", uid), {
      role: "USER",
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      {users.map((u) => (
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
          <p>Role: {u.role}</p>
          <p>Status: {u.status}</p>

          {/* Seller Fee Percent Display & Edit */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">Seller Fee (%):</span>
            <span className="font-mono text-base">
              {typeof u.sellerFeePercent === "number" ? u.sellerFeePercent : "—"}
            </span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="border rounded px-2 py-1 w-20 text-right"
              value={feeEdit[u.id] ?? ""}
              placeholder={typeof u.sellerFeePercent === "number" ? u.sellerFeePercent.toString() : ""}
              onChange={e => setFeeEdit(prev => ({ ...prev, [u.id]: e.target.value }))}
              disabled={feeLoading[u.id]}
            />
            <Button
              className="comic-button bg-green-500 border-green-500 text-white hover:bg-green-600"
              size="xs"
              aria-label="Update Seller Fee"
              disabled={feeLoading[u.id] || !feeEdit[u.id] || isNaN(Number(feeEdit[u.id]))}
              onClick={() => updateSellerFee(u.id, Number(feeEdit[u.id]))}
            >
              {feeLoading[u.id] ? "Saving..." : "Save"}
            </Button>
          </div>

          {/* Seller Tier Admin Update */}
          <div className="flex items-center gap-2 mb-2">
                      {/* Tier Change Audit Log */}
                      <div className="mt-2">
                        <button
                          className="text-xs underline text-blue-600 hover:text-blue-800"
                          onClick={async () => {
                            setLogOpen(prev => ({ ...prev, [u.id]: !prev[u.id] }));
                            if (!tierLogs[u.id]) await fetchTierLog(u.id);
                          }}
                        >
                          {logOpen[u.id] ? "Hide" : "Show"} Tier Change History
                        </button>
                        {logOpen[u.id] && (
                          <div className="mt-2 border rounded bg-gray-50 p-2 max-h-48 overflow-y-auto">
                            {tierLogs[u.id]?.length ? (
                              <ul className="space-y-1">
                                {tierLogs[u.id].map(log => (
                                  <li key={log.id} className="text-xs border-b last:border-b-0 pb-1 mb-1 last:mb-0">
                                    <div><b>{log.newTier}</b> ({log.type})</div>
                                    <div>By: {log.changedByEmail || log.changedBy || "?"}</div>
                                    <div>{log.changedAt?.toDate ? log.changedAt.toDate().toLocaleString() : ""}</div>
                                    {log.reason && <div>Reason: {log.reason}</div>}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-xs text-gray-500">No tier changes recorded.</div>
                            )}
                          </div>
                        )}
                      </div>
            <span className="text-sm">Seller Tier:</span>
            <span className="font-mono text-base">
              {u.sellerTier || "—"}
            </span>
            <select
              className="border rounded px-2 py-1"
              value={tierEdit[u.id] ?? (u.sellerTier || "")}
              onChange={e => setTierEdit(prev => ({ ...prev, [u.id]: e.target.value }))}
              disabled={tierLoading[u.id]}
              aria-label="Seller Tier"
              title="Seller Tier"
            >
              <option value="">Select…</option>
              <option value="BRONZE">BRONZE</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
            </select>
            <input
              type="text"
              className="border rounded px-2 py-1 w-40"
              placeholder="Reason (optional)"
              value={tierReason[u.id] ?? ""}
              onChange={e => setTierReason(prev => ({ ...prev, [u.id]: e.target.value }))}
              disabled={tierLoading[u.id]}
              aria-label="Reason for tier change"
            />
            <Button
              className="comic-button bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
              size="xs"
              aria-label="Update Seller Tier"
              disabled={tierLoading[u.id] || !tierEdit[u.id]}
              onClick={() => updateSellerTier(u.id, tierEdit[u.id] as "BRONZE" | "SILVER" | "GOLD")}
            >
              {tierLoading[u.id] ? "Saving..." : "Save"}
            </Button>
          </div>

          {u.suspendUntil && (
            <p className="text-sm text-gray-600">
              Suspended Until: {new Date(u.suspendUntil.toDate()).toLocaleString()}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {/* --- ROLE MANAGEMENT --- */}
            {u.role !== "ADMIN" && u.role !== "MODERATOR" && (
              <Button
                className="comic-button bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                aria-label="Promote to Moderator"
                onClick={() => promoteToModerator(u.id)}
                size="xs"
              >
                Promote to Moderator
              </Button>
            )}
            {u.role === "MODERATOR" && (
              <Button
                className="comic-button bg-gray-700 border-gray-700 text-white hover:bg-gray-800"
                aria-label="Remove Moderator"
                onClick={() => removeModerator(u.id)}
                size="xs"
              >
                Remove Moderator
              </Button>
            )}
            {/* --- SUSPENSIONS --- */}
            <Button
              className="comic-button bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
              aria-label="Suspend 24 hours"
              onClick={() => suspend(u.id, 24)}
              size="xs"
            >
              Suspend 24h
            </Button>
            <Button
              className="comic-button bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
              aria-label="Suspend 3 days"
              onClick={() => suspend(u.id, 72)}
              size="xs"
            >
              Suspend 3d
            </Button>
            <Button
              className="comic-button bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
              aria-label="Suspend 7 days"
              onClick={() => suspend(u.id, 168)}
              size="xs"
            >
              Suspend 7d
            </Button>
            <Button
              className="comic-button bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
              aria-label="Suspend 30 days"
              onClick={() => suspend(u.id, 720)}
              size="xs"
            >
              Suspend 30d
            </Button>
            {/* --- BAN / RESTORE --- */}
            <Button
              className="comic-button bg-red-600 border-red-600 text-white hover:bg-red-700"
              aria-label="Ban User"
              onClick={() => ban(u.id)}
              size="xs"
            >
              Ban User
            </Button>
            <Button
              className="comic-button bg-green-600 border-green-600 text-white hover:bg-green-700"
              aria-label="Restore User"
              onClick={() => restore(u.id)}
              size="xs"
            >
              Restore User
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
