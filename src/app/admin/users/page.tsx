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
