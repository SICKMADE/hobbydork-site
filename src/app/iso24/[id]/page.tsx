"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase/client-provider";
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
import { functions } from "@/firebase/client-provider";

export default function ISODetailPage() {
  const params = useParams();
  const isoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { user } = useAuth();
  const { toast } = useToast();

  const [iso, setISO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [offerUrl, setOfferUrl] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    if (!isoId) return;

    async function load() {
      try {
        const ref = doc(db, "iso24Posts", String(isoId));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setISO({ id: snap.id, ...snap.data() });
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isoId]);

  useEffect(() => {
    if (!isoId) return;
    async function loadOffers() {
      const ref = collection(db, "iso24Posts", String(isoId), "comments");
      const q = query(
        ref,
        where("type", "==", "FULFILLMENT"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    loadOffers();
  }, [isoId]);

  async function submitOffer() {
    if (!user?.uid || !isoId) return;
    if (!offerUrl.trim()) return;

    setSubmittingOffer(true);
    try {
      await addDoc(collection(db, "iso24Posts", String(isoId), "comments"), {
        type: "FULFILLMENT",
        authorUid: user.uid,
        listingUrl: offerUrl.trim(),
        createdAt: serverTimestamp(),
      });

      setOfferUrl("");

      const ref = collection(db, "iso24Posts", String(isoId), "comments");
      const q = query(
        ref,
        where("type", "==", "FULFILLMENT"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      toast({ title: "Link submitted" });
    } catch (err: any) {
      toast({
        variant: "destructive",
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

    setAwarding(true);
    try {
      const award = httpsCallable(functions, "awardIsoTrophy");
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

  if (!isoId) return <div className="p-6">Not found.</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (!iso) return <div className="p-6">Not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{iso.title}</h1>
      <p>{iso.description}</p>
      <p>Status: {iso.status}</p>

      {user?.uid && iso.status === "OPEN" && user.uid !== iso.ownerUid && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Have this item? Post your listing link.
          </div>
          <div className="flex gap-2">
            <Input
              value={offerUrl}
              onChange={(e) => setOfferUrl(e.target.value)}
              placeholder="Paste listing URL (example: /listings/abc123)"
            />
            <Button onClick={submitOffer} disabled={submittingOffer}>
              Submit
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium">Listing links</div>
        {offers.length === 0 && (
          <div className="text-sm text-muted-foreground">No links yet.</div>
        )}
        {offers.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-2 rounded border p-2"
          >
            <a
              href={o.listingUrl}
              className="text-sm underline truncate"
              target="_blank"
              rel="noreferrer"
            >
              {o.listingUrl}
            </a>

            {user?.uid === iso.ownerUid && iso.status === "OPEN" && (
              <Button
                variant="outline"
                disabled={awarding}
                onClick={() => approveOffer(o.id)}
              >
                Approve + Award Trophy
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
