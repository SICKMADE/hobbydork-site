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
import { storage } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  createdAt?: any;
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
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = React.useState<string | null>(null);
  const [isActive, setIsActive] = React.useState(false);
  const [startAt, setStartAt] = React.useState("");
  const [endAt, setEndAt] = React.useState("");
  const [savingConfig, setSavingConfig] = React.useState(false);

  const onPickBanner = React.useCallback(
    (file: File | null) => {
      setBannerFile(file);
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
        setBannerPreviewUrl(null);
      }
      if (file) {
        setBannerPreviewUrl(URL.createObjectURL(file));
      }
    },
    [bannerPreviewUrl]
  );

  React.useEffect(() => {
    // Strict Firestore read gate
    const canReadFirestore = isStaff;
    if (!canReadFirestore || !db) return;

    const q = query(collection(db, "giveawayEntries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GiveawayEntry));
    });

    return () => unsub();
  }, [isStaff]);

  React.useEffect(() => {
    // Strict Firestore read gate
    const canReadFirestore = isStaff;
    if (!canReadFirestore || !db) return;

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
      onPickBanner(null);
      setIsActive(Boolean(data.isActive));
      setStartAt(toDateTimeLocalValue(data.startAt?.toDate?.() || null));
      setEndAt(toDateTimeLocalValue(data.endAt?.toDate?.() || null));
    });

    return () => unsub();
  }, [isStaff, onPickBanner]);

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

    if (bannerFile && !storage) {
      toast({
        title: "Uploads unavailable",
        description: "Storage is not ready yet. Refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setSavingConfig(true);
    try {
      let nextImageUrl = imageUrl.trim();
      if (bannerFile && userData?.uid) {
        if (!storage) {
          toast({
            title: "Storage unavailable",
            description: "Could not upload image. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        const safeName = bannerFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `giveawayImages/${userData.uid}/${GIVEAWAY_ID}/${Date.now()}-${safeName}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, bannerFile);
        nextImageUrl = await getDownloadURL(storageRef);
      }

      if (!db) {
        toast({
          title: "Database unavailable",
          description: "Could not save giveaway. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      await setDoc(
        doc(db, "giveaways", GIVEAWAY_ID),
        {
          title: title.trim(),
          prize: prize.trim(),
          imageUrl: nextImageUrl,
          isActive,
          startAt: start,
          endAt: end,
          updatedAt: serverTimestamp(),
          createdAt: config && typeof config.createdAt !== 'undefined' ? config.createdAt : serverTimestamp(),
        },
        { merge: true },
      );

      toast({ title: "Giveaway saved" });
      onPickBanner(null);
    } catch (e) {
      const err = e as Error;
      toast({ title: "Save failed", description: err?.message || "" });
    } finally {
      setSavingConfig(false);
    }
  }

  async function setStatus(id: string, status: GiveawayEntry["status"]) {
    try {
      if (!db) {
        toast({
          title: "Database unavailable",
          description: "Could not update status. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      await updateDoc(doc(db, "giveawayEntries", id), {
        status,
        reviewedAt: new Date(),
        reviewedBy: userData?.uid || null,
      });
      toast({ title: `Marked ${status.toLowerCase()}` });
    } catch (e) {
      const err = e as Error;
      toast({ title: "Update failed", description: err?.message || "" });
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

        <Card className="border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
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
                <Label>Banner image</Label>
                <Input type="file" accept="image/*" onChange={(e) => onPickBanner(e.target.files?.[0] ?? null)} />
                {(bannerPreviewUrl || imageUrl) && (
                  <div className="rounded-md border bg-muted p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerPreviewUrl || imageUrl}
                      alt="Giveaway banner preview"
                      className="w-full max-h-[260px] object-contain"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                        onClick={() => {
                          setImageUrl("");
                          onPickBanner(null);
                        }}
                      >
                        Remove banner
                      </Button>
                    </div>
                  </div>
                )}
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
              className={`comic-button ${show === s ? 'bg-primary text-white border-primary' : 'bg-card/80 border-muted text-muted-foreground hover:bg-primary/10'}`}
              size="sm"
              onClick={() => setShow(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((e) => (
            <Card key={e.id} className="rounded-2xl border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="font-bold text-base">{e.platform.toUpperCase()} • {e.status}</span>
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
                  <a className="text-primary underline font-bold" href={e.postUrl} target="_blank" rel="noreferrer">
                    {e.postUrl}
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    className="comic-button bg-green-600 border-green-600 text-white hover:bg-green-700"
                    size="xs"
                    disabled={e.status === "APPROVED"}
                    onClick={() => setStatus(e.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    className="comic-button bg-red-600 border-red-600 text-white hover:bg-red-700"
                    size="xs"
                    disabled={e.status === "REJECTED"}
                    onClick={() => setStatus(e.id, "REJECTED")}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    className="comic-button bg-gray-700 border-gray-700 text-white hover:bg-gray-800"
                    size="xs"
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
