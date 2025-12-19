"use client";

import * as React from "react";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { db } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const GIVEAWAY_ID = "current";

type GiveawayConfig = {
  title?: string;
  prize?: string;
  imageUrl?: string;
  isActive?: boolean;
  startAt?: { toDate: () => Date };
  endAt?: { toDate: () => Date };
};

function toDateTimeLocalValue(d: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseDateTimeLocalValue(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

type GiveawayEntry = {
  id: string;
  uid: string;
  giveawayId: string;
  platform: "x" | "facebook" | "instagram" | "tiktok";
  postUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: { toDate: () => Date };
  reviewedAt?: { toDate: () => Date };
  reviewedBy?: string;
};

export default function AdminGiveawayPage() {
  const { userData, loading } = useAuth();
  const { toast } = useToast();

  const role = userData?.role;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";
  const isStaff = isAdmin || isModerator;

  const [entries, setEntries] = React.useState<GiveawayEntry[]>([]);
  const [show, setShow] = React.useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const [config, setConfig] = React.useState<GiveawayConfig | null>(null);
  const [title, setTitle] = React.useState("");
  const [prize, setPrize] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(false);
  const [startAt, setStartAt] = React.useState("");
  const [endAt, setEndAt] = React.useState("");
  const [savingConfig, setSavingConfig] = React.useState(false);

  React.useEffect(() => {
    if (!isStaff) return;

    const q = query(collection(db, "giveawayEntries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GiveawayEntry));
    });

    return () => unsub();
  }, [isStaff]);

  React.useEffect(() => {
    if (!isStaff) return;

    const unsub = onSnapshot(doc(db, "giveaways", GIVEAWAY_ID), (snap) => {
      if (!snap.exists()) {
        setConfig(null);
        setTitle("");
        setPrize("");
        setIsActive(false);
        setStartAt("");
        setEndAt("");
        return;
      }

      const data = snap.data() as GiveawayConfig;
      setConfig(data);
      setTitle(data.title || "");
      setPrize(data.prize || "");
      setImageUrl(data.imageUrl || "");
      setIsActive(Boolean(data.isActive));
      setStartAt(toDateTimeLocalValue(data.startAt?.toDate?.() || null));
      setEndAt(toDateTimeLocalValue(data.endAt?.toDate?.() || null));
    });

    return () => unsub();
  }, [isStaff]);

  async function saveGiveawayConfig() {
    const start = parseDateTimeLocalValue(startAt);
    const end = parseDateTimeLocalValue(endAt);

    if (!title.trim()) {
      toast({ title: "Missing title" });
      return;
    }

    if (!start || !end) {
      toast({ title: "Missing dates", description: "Start and end time are required." });
      return;
    }

    if (end.getTime() <= start.getTime()) {
      toast({ title: "Invalid window", description: "End time must be after start time." });
      return;
    }

    setSavingConfig(true);
    try {
      await setDoc(
        doc(db, "giveaways", GIVEAWAY_ID),
        {
          title: title.trim(),
          prize: prize.trim(),
          imageUrl: imageUrl.trim(),
          isActive,
          startAt: start,
          endAt: end,
          updatedAt: serverTimestamp(),
          createdAt: config ? (config as any).createdAt || serverTimestamp() : serverTimestamp(),
        },
        { merge: true },
      );

      toast({ title: "Giveaway saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "" });
    } finally {
      setSavingConfig(false);
    }
  }

  async function setStatus(id: string, status: GiveawayEntry["status"]) {
    try {
      await updateDoc(doc(db, "giveawayEntries", id), {
        status,
        reviewedAt: new Date(),
        reviewedBy: userData?.uid || null,
      });
      toast({ title: `Marked ${status.toLowerCase()}` });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "" });
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading…</div>
      </AppLayout>
    );
  }

  if (!isStaff) {
    return (
      <AppLayout>
        <div className="p-6">You do not have access.</div>
      </AppLayout>
    );
  }

  const filtered = entries.filter((e) => (show === "ALL" ? true : e.status === show));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Giveaway Entries</h1>
            <p className="text-sm text-muted-foreground">Review and approve/reject entries.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Back to Admin</Link>
          </Button>
        </div>

        <Card className="border border-red-500/40 bg-muted/40">
          <CardHeader>
            <CardTitle>Giveaway Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prize</Label>
                <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Banner image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End time</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
              <div className="text-sm">Active (accept entries only inside the window)</div>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={saveGiveawayConfig} disabled={savingConfig}>
                {savingConfig ? "Saving…" : "Save Giveaway"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Public page reads from <span className="font-mono">giveaways/{GIVEAWAY_ID}</span>.
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 text-sm">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={show === s ? "default" : "outline"}
              onClick={() => setShow(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>
                    {e.platform.toUpperCase()} • {e.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {e.createdAt?.toDate?.() ? e.createdAt.toDate().toLocaleString() : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">User:</span> {e.uid}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Giveaway:</span> {e.giveawayId}
                </div>
                <div className="text-sm break-all">
                  <span className="font-semibold">Post:</span> {" "}
                  <a className="underline" href={e.postUrl} target="_blank" rel="noreferrer">
                    {e.postUrl}
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={e.status === "APPROVED"}
                    onClick={() => setStatus(e.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={e.status === "REJECTED"}
                    onClick={() => setStatus(e.id, "REJECTED")}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={e.status === "PENDING"}
                    onClick={() => setStatus(e.id, "PENDING")}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">No entries.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
