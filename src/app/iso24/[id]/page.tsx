"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase/client-provider";
import { getFirebase } from "@/firebase/client-init";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { httpsCallable } from "firebase/functions";
// import { functions } from "@/firebase/client-provider"; // Removed: not exported from client-provider
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { labelIso24Category, normalizeIso24Category } from "@/lib/iso24";

export default function ISODetailPage() {
  const params = useParams();
  const isoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isGuest = !user;
    const isGuest = !user;
    const needsOverlay = isGuest;
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [offerUrl, setOfferUrl] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    if (!isoId) return;

    async function load() {
      //
      const canReadFirestore = !!user;
      if (!canReadFirestore) {
        setLoading(false);
        return;
      }
      if (!db) return;
      try {
        const ref = doc(db!, "iso24Posts", String(isoId));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setISO({ id: snap.id, ...snap.data() });
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isoId, user]);

  useEffect(() => {
    if (!isoId) return;
    async function loadOffers() {
      //
      const canReadFirestore = !!user;

      const snap = await getDocs(q);
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    loadOffers();
  }, [isoId, user]);

  async function submitOffer() {
    if (!user?.uid || !isoId) return;
    if (!offerUrl.trim()) return;

    if (profile?.status && profile.status !== "ACTIVE") {
      toast({
        variant: "destructive",
        title: "Account restricted",
        description: "Your account is not active.",
      });
      return;
    }
    setSubmittingOffer(true);
    if (!db) return;
    try {
      await addDoc(collection(db!, "iso24Posts", String(isoId), "comments"), {
        type: "FULFILLMENT",
        authorUid: user.uid,
        listingUrl: offerUrl.trim(),
        createdAt: serverTimestamp(),
      });

      setOfferUrl("");

      const ref = collection(db!, "iso24Posts", String(isoId), "comments");
      const q = query(
        ref,
        where("type", "==", "FULFILLMENT"),
        title: "Could not submit",
        description: err?.message || "Try again.",
      });
    } finally {
      setSubmittingOffer(false);
    }
  }

  async function approveOffer(offerId: string) {
    if (!user?.uid || !isoId) return;
    if (!iso || iso.ownerUid !== user.uid) return;

    if (profile?.status && profile.status !== "ACTIVE") {
      toast({
        variant: "destructive",
        title: "Account restricted",
        description: "Your account is not active.",
      });
      return;
    }
    setAwarding(true);
    try {
      const { functions } = getFirebase();
      if (!functions) throw new Error("Cloud Functions not initialized");
      const award = httpsCallable(functions as import("firebase/functions").Functions, "awardIsoTrophy");
      await award({ isoId: String(isoId), commentId: offerId });

      toast({ title: "Trophy awarded" });
      setISO({ ...iso, status: "CLOSED" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could not award trophy",
        description: err?.message || "Try again.",
      });
    } finally {
      setAwarding(false);
    }
  }

  if (!isoId)
    return (
      <AppLayout>
        <div className="p-6">Not found.</div>
      </AppLayout>
    );
  if (needsOverlay) {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-2xl px-4 py-16 flex flex-col items-center justify-center text-center">
          <img src="/ISO.png" alt="ISO24" width={120} height={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">ISO24</h2>
          <p className="mb-4 text-muted-foreground">Sign in and verify your email to view or interact with ISO24 posts.</p>
          <Button asChild className="comic-button">
            <a href="/login">Sign In / Verify</a>
          </Button>
        </div>
      </AppLayout>
    );
  }
  if (loading)
    return (
      <AppLayout>
        <div className="p-6">Loading…</div>
      </AppLayout>
    );
  if (!iso)
    return (
      <AppLayout>
        <div className="p-6">Not found.</div>
      </AppLayout>
    );

  const categoryLabel = labelIso24Category(normalizeIso24Category(iso.category));
  const expiresAtDate = iso.expiresAt?.toDate ? iso.expiresAt.toDate() : null;
  const isExpired = Boolean(expiresAtDate && expiresAtDate.getTime() <= Date.now());
  const isOpen = String(iso.status || '').toUpperCase() === 'OPEN' && !isExpired;
  const isOwner = Boolean(user?.uid && iso.ownerUid === user.uid);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{iso.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-2 border-black bg-muted/40">
                {categoryLabel}
              </Badge>
              <Badge
                variant="outline"
                className={
                  isOpen
                    ? 'border-green-500/40 bg-muted/40'
                    : 'border-red-500/40 bg-muted/40'
                }
              >
                {isOpen ? 'OPEN' : isExpired ? 'EXPIRED' : String(iso.status || 'CLOSED')}
              </Badge>
            </div>
          </div>
          {expiresAtDate && (
            <div className="text-sm text-muted-foreground">
              Expires {expiresAtDate.toLocaleString()}
            </div>
          )}
        </div>

        <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <CardContent className="p-0">
            {iso.imageUrl ? (
              <div className="relative h-[260px] md:h-[340px] bg-muted rounded-t-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={String(iso.imageUrl)}
                  alt={String(iso.title || 'ISO image')}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null}
            <div className="p-4">
              <div className="text-sm whitespace-pre-line">
                {iso.description || 'No description.'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Fulfill this ISO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.uid && isOpen && !isOwner && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Have this item? Post your listing link.
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={offerUrl}
                    onChange={(e) => setOfferUrl(e.target.value)}
                    placeholder="Paste listing URL (example: /listings/abc123)"
                  />
                  <Button onClick={submitOffer} disabled={submittingOffer} className="comic-button">
                    {submittingOffer ? 'Submitting…' : 'Submit'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tip: Use your own listing URL for best results.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Listing links</div>
              {offers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                  <div className="text-3xl mb-2">🔗</div>
                  <div className="font-semibold mb-1">No links yet</div>
                  <div className="mb-2 text-xs">When someone submits a listing, it will appear here.</div>
                </div>
              )}
              {offers.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border-2 border-black bg-muted/30 p-3"
                >
                  <a
                    href={o.listingUrl}
                    className="text-sm underline break-all"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {o.listingUrl}
                  </a>

                  {isOwner && isOpen && (
                    <Button
                      variant="outline"
                      className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                      disabled={awarding}
                      onClick={() => approveOffer(o.id)}
                    >
                      {awarding ? 'Awarding…' : 'Approve + Award Trophy'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
