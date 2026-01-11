"use client";

import { useState } from "react";
import { db } from "@/firebase/client-provider";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
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
  };

  const [users] = useState<User[]>([]); // Remove setUsers as it's unused
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      {users.map((u) => (
        <div
          key={u.id}
          className="border p-4 bg-white rounded shadow space-y-2"
        >
          <p className="font-semibold">
            {u.role === "ADMIN" && "👑 "}
            {u.role === "MODERATOR" && "🛡️ "}
            {u.displayName}
          </p>

          <p>Email: {u.email}</p>
          <p>Role: {u.role}</p>
          <p>Status: {u.status}</p>

          {u.suspendUntil && (
            <p className="text-sm text-gray-600">
              Suspended Until: {new Date(u.suspendUntil.toDate()).toLocaleString()}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {/* --- ROLE MANAGEMENT --- */}
            {u.role !== "ADMIN" && u.role !== "MODERATOR" && (
              <Button
                variant="secondary"
                aria-label="Promote to Moderator"
                onClick={() => promoteToModerator(u.id)}
              >
                Promote to Moderator
              </Button>
            )}
            {u.role === "MODERATOR" && (
              <Button
                variant="outline"
                aria-label="Remove Moderator"
                onClick={() => removeModerator(u.id)}
              >
                Remove Moderator
              </Button>
            )}
            {/* --- SUSPENSIONS --- */}
            <Button
              variant="outline"
              aria-label="Suspend 24 hours"
              onClick={() => suspend(u.id, 24)}
            >
              Suspend 24h
            </Button>
            <Button
              variant="outline"
              aria-label="Suspend 3 days"
              onClick={() => suspend(u.id, 72)}
            >
              Suspend 3d
            </Button>
            <Button
              variant="outline"
              aria-label="Suspend 7 days"
              onClick={() => suspend(u.id, 168)}
            >
              Suspend 7d
            </Button>
            <Button
              variant="outline"
              aria-label="Suspend 30 days"
              onClick={() => suspend(u.id, 720)}
            >
              Suspend 30d
            </Button>
            {/* --- BAN / RESTORE --- */}
            <Button
              variant="destructive"
              aria-label="Ban User"
              onClick={() => ban(u.id)}
            >
              Ban User
            </Button>
            <Button
              variant="secondary"
              aria-label="Restore User"
              onClick={() => restore(u.id)}
            >
              Restore User
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
