"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase/client-provider";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  where,
  updateDoc,
} from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

export default function GroupChatPage() {
  const { user, userData } = useAuth(); // userData contains role
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const [actionUser, setActionUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // LOAD LIVE MESSAGES
  useEffect(() => {
    const qMsg = query(
      collection(db, "groupChat"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(qMsg, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });
    return () => unsub();
  }, []);

  // SEND MESSAGE
  async function send() {
    if (!user || !text.trim()) return;

    await addDoc(collection(db, "groupChat"), {
      uid: user.uid,
      displayName: userData.displayName,
      avatar: userData.avatar || null,
      role: userData.role || "USER",
      text,
      createdAt: serverTimestamp(),
    });

    setText("");
  }

  // DELETE SINGLE MESSAGE (admin/mod)
  async function deleteMessage(messageId: string) {
    await deleteDoc(doc(db, "groupChat", messageId));
    setActionUser(null);
  }

  // DELETE ALL MESSAGES FROM USER (admin only)
  async function deleteAllMessages(targetUid: string) {
    const q = query(collection(db, "groupChat"), where("uid", "==", targetUid));
    const snap = await getDocs(q);
    const batchDeletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(batchDeletes);
    setActionUser(null);
  }

  // SUSPEND USER (mod/admin)
  async function suspendUser(targetUid: string, hours: number) {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    const q = query(collection(db, "users"), where("uid", "==", targetUid));
    const snap = await getDocs(q);

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        status: "SUSPENDED",
        suspendUntil: until,
      });
    }
    setActionUser(null);
  }

  // BAN USER (admin only)
  async function banUser(targetUid: string) {
    const q = query(collection(db, "users"), where("uid", "==", targetUid));
    const snap = await getDocs(q);

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        status: "BANNED",
        suspendUntil: null,
      });
    }
    setActionUser(null);
  }

  // VIEW STORE
  async function viewStore(targetUid: string) {
    const q = query(collection(db, "users"), where("uid", "==", targetUid));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const storeId = snap.docs[0].data().storeId;
      window.location.href = `/store/${storeId}`;
    }
  }

  if (!user) return <div className="p-6">Sign in required.</div>;

  // ROLE BADGE STYLE
  function roleNameStyle(role: string) {
    if (role === "ADMIN") return "text-yellow-400 font-bold";
    if (role === "MODERATOR") return "text-lime-400 font-semibold";
    return "text-neutral-900";
  }

  function roleIcon(role: string) {
    if (role === "ADMIN") return "👑 ";
    if (role === "MODERATOR") return "🛡️ ";
    return "";
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-[85vh] bg-white text-black rounded-2xl shadow-xl border border-black/10">

      {/* ACTION MENU */}
      {actionUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 space-y-4 w-72 shadow-xl">
            <p className="font-semibold text-lg">
              {roleIcon(actionUser.role)}
              {actionUser.displayName}
            </p>

            {/* VIEW STORE */}
            <Button
              className="w-full"
              onClick={() => viewStore(actionUser.uid)}
            >
              View Store
            </Button>

            {/* SEND DM */}
            <Link
              href={`/messages/${[user.uid, actionUser.uid].sort().join("_")}`}
            >
              <Button className="w-full">Send Message</Button>
            </Link>

            {/* REPORT */}
            <Button
              className="w-full bg-orange-500 text-white"
              onClick={() => {
                addDoc(collection(db, "reports"), {
                  reporterUid: user.uid,
                  targetUid: actionUser.uid,
                  reason: "Live Chat Report",
                  createdAt: serverTimestamp(),
                });
                setActionUser(null);
              }}
            >
              Report User
            </Button>

            {/* MODERATOR & ADMIN ACTIONS */}
            {(userData.role === "ADMIN" || userData.role === "MODERATOR") && (
              <>
                {/* Delete message */}
                <Button
                  className="w-full bg-red-500 text-white"
                  onClick={() => deleteMessage(actionUser.messageId)}
                >
                  Delete Message
                </Button>

                {/* Suspend (mod/admin) */}
                <Button
                  className="w-full bg-blue-600 text-white"
                  onClick={() => suspendUser(actionUser.uid, 24)}
                >
                  Suspend 24h
                </Button>
                <Button
                  className="w-full bg-blue-600 text-white"
                  onClick={() => suspendUser(actionUser.uid, 72)}
                >
                  Suspend 3d
                </Button>
              </>
            )}

            {/* ADMIN ONLY */}
            {userData.role === "ADMIN" && (
              <>
                <Button
                  className="w-full bg-blue-600 text-white"
                  onClick={() => suspendUser(actionUser.uid, 168)}
                >
                  Suspend 7d
                </Button>

                <Button
                  className="w-full bg-blue-600 text-white"
                  onClick={() => suspendUser(actionUser.uid, 720)}
                >
                  Suspend 30d
                </Button>

                <Button
                  className="w-full bg-red-700 text-white"
                  onClick={() => banUser(actionUser.uid)}
                >
                  Ban User
                </Button>

                <Button
                  className="w-full bg-red-700 text-white"
                  onClick={() => deleteAllMessages(actionUser.uid)}
                >
                  Delete ALL Messages
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setActionUser(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* CHAT FEED */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 rounded-xl border border-black/10 bg-white p-4">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 items-start">

            {/* AVATAR */}
            <div
              onClick={() => setActionUser({ ...m, messageId: m.id })}
              className="cursor-pointer"
            >
              {m.avatar ? (
                <img
                  src={m.avatar}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <img
                  src={getDefaultAvatarUrl(m.uid)}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
            </div>

            {/* MESSAGE */}
            <div>
              <p className={`text-xs ${roleNameStyle(m.role)}`}>
                {roleIcon(m.role)}
                {m.displayName}
              </p>
              <div className="bg-gray-200 text-black rounded p-2 max-w-xs">
                {m.text}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-black/10">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="bg-white text-black placeholder:text-neutral-500 border-black/20"
        />
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
}
