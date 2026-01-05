"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GroupChatPage() {
  const { user, profile } = useAuth(); // profile contains role
  const { toast } = useToast();
  type Message = {
    id: string;
    uid: string;
    displayName?: string;
    avatar?: string | null;
    role?: string;
    text: string;
    createdAt?: { toDate: () => Date };
    storeId?: string | null; // allow storeId for actionUser
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [actionUser, setActionUser] = useState<(Message & { messageId?: string }) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Strict Firestore read gate
  useEffect(() => {
    const canReadFirestore = !!user && user.emailVerified;
    if (!canReadFirestore || !db) return;
    const qMsg = query(
      collection(db, "groupChat"),
      orderBy("createdAt", "asc")
    );
    // TypeScript-safe Firestore query debug
    console.trace('🔥 Firestore QUERY:', qMsg?.toString?.() ?? qMsg);
    const unsub = onSnapshot(qMsg, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data();
          // Ensure all Message fields are present
          return {
            id: d.id,
            uid: data.uid,
            displayName: data.displayName,
            avatar: data.avatar,
            role: data.role,
            text: data.text,
            createdAt: data.createdAt,
            storeId: data.storeId ?? null,
          };
        })
      );
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });
    return () => unsub();
  }, [user]);

  // SEND MESSAGE
  async function send() {
    if (!user || !profile || !text.trim() || !db) return;

    try {
      await addDoc(collection(db, "groupChat"), {
        uid: user.uid,
        displayName: profile.displayName,
        avatar: profile.avatar || null,
        role: profile.role || "USER",
        text,
        createdAt: serverTimestamp(),
      });

      setText("");
    } catch (e: unknown) {
      toast({
        title: "Could not send",
        description: e instanceof Error ? e.message : "Message send failed.",
        variant: "destructive",
      });
    }
  }

  // DELETE SINGLE MESSAGE (admin/mod)
  async function deleteMessage(messageId: string) {
    if (!db) return;
    await deleteDoc(doc(db, "groupChat", messageId));
    setActionUser(null);
  }

  // DELETE ALL MESSAGES FROM USER (admin only)
  async function deleteAllMessages(targetUid: string) {
    const canReadFirestore = !!user && user.emailVerified;
    if (!canReadFirestore || !db) return;
    const q = query(collection(db, "groupChat"), where("uid", "==", targetUid));
    console.trace('🔥 Firestore QUERY:', q?.toString?.() ?? q);
    const snap = await getDocs(q);
    const batchDeletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(batchDeletes);
    setActionUser(null);
  }

  // SUSPEND USER (mod/admin)
  async function suspendUser(targetUid: string, hours: number) {
    const canReadFirestore = !!user && user.emailVerified;
    if (!canReadFirestore || !db) return;
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    const q = query(collection(db, "users"), where("uid", "==", targetUid));
    console.trace('🔥 Firestore QUERY:', q?.toString?.() ?? q);
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
    const canReadFirestore = !!user && user.emailVerified;
    if (!canReadFirestore || !db) return;
    const q = query(collection(db, "users"), where("uid", "==", targetUid));
    console.trace('🔥 Firestore QUERY:', q?.toString?.() ?? q);
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
  async function viewStoreFromMessage(targetUid: string, storeIdFromMessage?: string | null) {
    const canReadFirestore = !!user && user.emailVerified;
    if (!canReadFirestore || !db) return;
    try {
      if (storeIdFromMessage) {
        window.location.href = `/store/${storeIdFromMessage}`;
        return;
      }

      // Avoid reading users/{uid} (often blocked). Prefer storefronts lookup by ownerUid.
      const qStores = query(
        collection(db, "storefronts"),
        where("ownerUid", "==", targetUid)
      );
      console.trace('🔥 Firestore QUERY:', qStores?.toString?.() ?? qStores);
      const snapStores = await getDocs(qStores);
      if (!snapStores.empty) {
        window.location.href = `/store/${snapStores.docs[0].id}`;
        return;
      }

      toast({
        title: "No store found",
        description: "This user does not have a store set up.",
      });
    } catch (e: unknown) {
      toast({
        title: "Could not open store",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>You must be signed in to use community chat.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login?redirect=/chat">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isAdmin = profile?.role === "ADMIN";
  const isMod = profile?.role === "MODERATOR";
  const isStaff = isAdmin || isMod;

  const roleLabel = (role?: string) => {
    if (role === "ADMIN") return "Admin";
    if (role === "MODERATOR") return "Mod";
    if (role === "SELLER") return "Seller";
    return null;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Community Chat</h1>
            <p className="text-sm text-muted-foreground">
              Keep it respectful. Read the <Link href="/community-rules" className="underline">community rules</Link>.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">Live</Badge>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-muted/40 p-3 md:p-4">
          <div className="flex flex-col h-[75vh]">

      {/* ACTION MENU */}
      {actionUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{actionUser.displayName || "User"}</CardTitle>
              <CardDescription className="text-xs">
                {roleLabel(actionUser.role) ? `${roleLabel(actionUser.role)} • ` : ""}{actionUser.uid}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">

            {/* VIEW STORE */}
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => viewStoreFromMessage(actionUser.uid, actionUser.storeId)}
            >
              View Store
            </Button>

            {/* SEND DM */}
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => {
                window.location.href = `/messages/new?recipientUid=${encodeURIComponent(actionUser.uid)}`;
              }}
            >
              Send Message
            </Button>

            {/* REPORT */}
            <Button
              className="w-full justify-start"
              variant="destructive"
              onClick={() => {
                if (db) {
                  addDoc(collection(db, "reports"), {
                    reporterUid: user.uid,
                    targetUid: actionUser.uid,
                    reason: "Live Chat Report",
                    createdAt: serverTimestamp(),
                  });
                }
                setActionUser(null);
              }}
            >
              Report User
            </Button>

            {/* MODERATOR & ADMIN ACTIONS */}
            {isStaff && (
              <>
                {/* Delete message */}
                <Button
                  className="w-full justify-start"
                  variant="destructive"
                  onClick={() => deleteMessage(actionUser.id)}
                >
                  Delete Message
                </Button>

                {/* Suspend (mod/admin) */}
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => suspendUser(actionUser.uid, 24)}
                >
                  Suspend 24h
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => suspendUser(actionUser.uid, 72)}
                >
                  Suspend 3d
                </Button>
              </>
            )}

            {/* ADMIN ONLY */}
            {isAdmin && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => suspendUser(actionUser.uid, 168)}
                >
                  Suspend 7d
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => suspendUser(actionUser.uid, 720)}
                >
                  Suspend 30d
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="destructive"
                  onClick={() => banUser(actionUser.uid)}
                >
                  Ban User
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="destructive"
                  onClick={() => deleteAllMessages(actionUser.uid)}
                >
                  Delete ALL Messages
                </Button>
              </>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActionUser(null)}
            >
              Close
            </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHAT FEED */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 rounded-xl border bg-background/70 p-4">
        {messages.map((m) => {
          const isSelf = m.uid === user.uid;
          const label = roleLabel(m.role);
          return (
            <div key={m.id} className={`flex gap-3 items-start ${isSelf ? "justify-end" : ""}`}>
              {!isSelf && (
                <button
                  type="button"
                  title="View user actions"
                  onClick={() => setActionUser(m)}
                  className="shrink-0"
                >
                  <Image
                    src={m.avatar || getDefaultAvatarUrl(m.uid)}
                    className="w-9 h-9 rounded-full object-cover border"
                    alt="avatar"
                    width={36}
                    height={36}
                  />
                </button>
              )}

              <div className={`max-w-[85%] ${isSelf ? "text-right" : ""}`}>
                <div className={`flex items-center gap-2 mb-1 ${isSelf ? "justify-end" : ""}`}>
                  <button
                    type="button"
                    title="View user actions"
                    onClick={() => setActionUser(m)}
                    className="text-xs font-semibold hover:underline"
                  >
                    {m.displayName || "User"}
                  </button>
                  {label && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>}
                </div>
                <div
                  className={`rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap ${
                    isSelf
                      ? "bg-muted/30 border-border"
                      : "bg-muted border-border"
                  }`}
                >
                  {m.text}
                </div>
              </div>

              {isSelf && (
                <button
                  type="button"
                  title="View user actions"
                  onClick={() => setActionUser(m)}
                  className="shrink-0"
                >
                  <Image
                    src={m.avatar || profile?.avatar || getDefaultAvatarUrl(user.uid)}
                    className="w-9 h-9 rounded-full object-cover border"
                    alt="avatar"
                    width={36}
                    height={36}
                  />
                </button>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-4 pt-3 border-t">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type a message…"
          className="bg-background"
        />
        <Button onClick={send} disabled={!text.trim()}>
          Send
        </Button>
      </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
