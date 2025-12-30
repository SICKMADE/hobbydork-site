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
import { useAuth } from "@/hooks/use-auth";

export default function AdminUsersPage() {
  const { userData } = useAuth();
  if (userData.role !== "ADMIN") {
    return <div className="p-6">You do not have access.</div>;
  }

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  // SUSPEND
  async function suspend(uid: string, hours: number) {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    await updateDoc(doc(db, "users", uid), {
      status: "SUSPENDED",
      suspendUntil: until,
      updatedAt: serverTimestamp(),
    });
  }

  // BAN
  async function ban(uid: string) {
    await updateDoc(doc(db, "users", uid), {
      status: "BANNED",
      suspendUntil: null,
      updatedAt: serverTimestamp(),
    });
  }

  // RESTORE
  async function restore(uid: string) {
    await updateDoc(doc(db, "users", uid), {
      status: "ACTIVE",
      suspendUntil: null,
      updatedAt: serverTimestamp(),
    });
  }

  // PROMOTE MODERATOR
  async function promoteToModerator(uid: string) {
    await updateDoc(doc(db, "users", uid), {
      role: "MODERATOR",
      updatedAt: serverTimestamp(),
    });
  }

  // DEMOTE MODERATOR
  async function removeModerator(uid: string) {
    await updateDoc(doc(db, "users", uid), {
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
