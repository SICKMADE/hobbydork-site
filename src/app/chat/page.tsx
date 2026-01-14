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
    if (!user || profile?.status !== "ACTIVE" || !db) return;
    const qMsg = query(
      collection(db, "groupChat"),
      orderBy("createdAt", "asc")
    );
    // TypeScript-safe Firestore query debug
    console.trace('🔥 Firestore QUERY:', qMsg?.toString?.() ?? qMsg);
    // Enforce check at call site
    if (!user || profile?.status !== "ACTIVE") return;
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
  }, [user, profile]);

  // SEND MESSAGE
  async function send() {
    if (!user || !profile || !text.trim() || !db) return;
    if (profile.status !== "ACTIVE") {
      toast({
        title: "Account restricted",
        description: "Your account is not active.",
        variant: "destructive",
      });
      return;
    }
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
      // Always scroll to bottom after sending
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
    if (!user || profile?.status !== "ACTIVE" || !db) return;
    // Enforce check at call site
    if (profile.status !== "ACTIVE") return;
    await deleteDoc(doc(db, "groupChat", messageId));
    setActionUser(null);
  }

  // DELETE ALL MESSAGES FROM USER (admin only)
  async function deleteAllMessages(targetUid: string) {
    if (!user || profile?.status !== "ACTIVE" || !db) return;
    // Enforce check at call site
    if (profile.status !== "ACTIVE") return;
    const q = query(collection(db, "groupChat"), where("uid", "==", targetUid));
    console.trace('🔥 Firestore QUERY:', q?.toString?.() ?? q);
    const snap = await getDocs(q);
    const batchDeletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(batchDeletes);
    setActionUser(null);
  }

  // SUSPEND USER (mod/admin)
  async function suspendUser(targetUid: string, hours: number) {
    if (!user || profile?.status !== "ACTIVE" || !db) return;
    // Enforce check at call site
    if (profile.status !== "ACTIVE") return;
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
    if (!user || profile?.status !== "ACTIVE" || !db) return;
    // Enforce check at call site
    if (profile.status !== "ACTIVE") return;
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
    const canReadFirestore = !!user;
    if (!canReadFirestore || !db) return;
    try {
      if (storeIdFromMessage) {
        window.location.href = `/store/${storeIdFromMessage}`;
        return;
      }

      // Avoid reading users/{uid} (often blocked). Prefer stores lookup by ownerUid.
      const qStores = query(
        collection(db, "stores"),
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
      {/* App-themed grid background */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-grid bg-[hsl(var(--background))]" />
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header - move PNG closer to top */}
        <div className="flex items-center justify-between gap-4 mt-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="relative h-20 w-52 md:h-24 md:w-80 flex-shrink-0">
              <Image src="/CHAT.png" alt="Chat" fill className="object-contain" priority />
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-[rgb(198,0,0)] text-white border-2 border-[rgb(198,0,0)] shadow">Live</Badge>
        </div>

        {/* Chat window with app card theme */}
        <div className="p-0 md:p-2">
          <div className="flex flex-col h-[75vh] rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,0.35)] border-2 border-[rgb(198,0,0)] bg-[#36383b] overflow-hidden">
            {/* ACTION MENU */}
            {actionUser && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-sm border-destructive/30 shadow-xl rounded-xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-700/80 backdrop-blur-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{actionUser.displayName || "User"}</CardTitle>
                    <CardDescription className="text-xs">
                      {roleLabel(actionUser.role) ? `${roleLabel(actionUser.role)} • ` : ""}{actionUser.uid}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* VIEW STORE */}
                    <Button className="w-full justify-start" variant="outline" onClick={() => viewStoreFromMessage(actionUser.uid, actionUser.storeId)}>View Store</Button>
                    {/* SEND DM */}
                    <Button className="w-full justify-start" variant="outline" onClick={() => {window.location.href = `/messages/new?recipientUid=${encodeURIComponent(actionUser.uid)}`;}}>Send Message</Button>
                    {/* REPORT */}
                    <Button className="w-full justify-start" variant="destructive" onClick={() => {if (db) {addDoc(collection(db, "reports"), {reporterUid: user.uid,targetUid: actionUser.uid,reason: "Live Chat Report",});}setActionUser(null);}}>Report User</Button>
                    {/* MODERATOR & ADMIN ACTIONS */}
                    {isStaff && (<><Button className="w-full justify-start" variant="destructive" onClick={() => deleteMessage(actionUser.id)}>Delete Message</Button><Button className="w-full justify-start" variant="secondary" onClick={() => suspendUser(actionUser.uid, 24)}>Suspend 24h</Button><Button className="w-full justify-start" variant="secondary" onClick={() => suspendUser(actionUser.uid, 72)}>Suspend 3d</Button></>)}
                    {/* ADMIN ONLY */}
                    {isAdmin && (<><Button className="w-full justify-start" variant="secondary" onClick={() => suspendUser(actionUser.uid, 168)}>Suspend 7d</Button><Button className="w-full justify-start" variant="secondary" onClick={() => suspendUser(actionUser.uid, 720)}>Suspend 30d</Button><Button className="w-full justify-start" variant="destructive" onClick={() => banUser(actionUser.uid)}>Ban User</Button><Button className="w-full justify-start" variant="destructive" onClick={() => deleteAllMessages(actionUser.uid)}>Delete ALL Messages</Button></>)}
                    <Button variant="outline" className="w-full" onClick={() => setActionUser(null)}>Close</Button>
                  </CardContent>
                </Card>
              </div>
            )}
            {/* CHAT FEED */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-4 md:px-6 rounded-2xl">
              {messages.map((m) => {
                const isSelf = m.uid === user.uid;
                const label = roleLabel(m.role);
                return (
                  <div key={m.id} className={`flex gap-3 items-start ${isSelf ? "justify-end" : ""}`}>
                    {/* Avatar */}
                    <button type="button" title="View user actions" onClick={() => setActionUser(m)} className={`shrink-0 transition-transform hover:scale-105 comic-avatar-shadow ${isSelf ? "order-2" : ""}`}>
                      <Image src={m.avatar || getDefaultAvatarUrl(m.uid)} className="w-10 h-10 rounded-full object-cover" alt="avatar" width={40} height={40} />
                    </button>
                    {/* Message bubble */}
                    <div className={`max-w-[80%] ${isSelf ? "text-right order-1" : "order-1"}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isSelf ? "justify-end flex-row-reverse" : ""}`}>
                        <span className="font-semibold text-xs text-primary">{m.displayName}</span>
                        {label && <Badge className="ml-1 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground border border-primary shadow">{label}</Badge>}
                      </div>
                      <div className={isSelf ? "comic-bubble-me" : "comic-bubble-them"}>{m.text}</div>
                      <div className="text-xs text-muted-foreground">{m.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {/* INPUT */}
            <div className="flex items-center gap-2 pt-2 px-4 pb-4 bg-gray-900/60 border-t border-white/10 rounded-b-2xl">
              <Input className="flex-1 comic-input-field bg-white !text-black placeholder:text-gray-500" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." maxLength={300} onKeyDown={(e) => {if (e.key === "Enter") send();}} disabled={!user || profile?.status !== "ACTIVE"} />
              <Button
                onClick={send}
                disabled={!user || profile?.status !== "ACTIVE" || !text.trim()}
                className="font-bold text-base px-6 py-2 rounded-full bg-[rgb(198,0,0)] text-white border-[5px] border-black shadow-[5px_5px_0_rgba(0,0,0,0.45)] active:scale-97 transition-transform comic-button"
                style={{
                  boxShadow: '6px 6px 0 #000',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.04em',
                }}
              >
                <span className="send-btn-label">SEND</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
