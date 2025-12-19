"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/lib/types";
import { db } from "@/firebase/client-provider";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SellerListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Partial<Listing>[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "listings"),
      where("ownerUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<Listing>) })));
    });

    return () => unsub();
  }, [user]);

  const setVisibility = async (listingId: string, makePublic: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "listings", listingId), {
        state: makePublic ? "ACTIVE" : "DRAFT",
        status: makePublic ? "ACTIVE" : "DRAFT",
        updatedAt: serverTimestamp(),
      });
      toast({ title: makePublic ? "Published" : "Made private" });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ?? "Could not update listing visibility.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Listings</h1>

      {listings.map((l) => (
        <div key={l.id} className="border p-4 bg-white rounded shadow space-y-2">
          <p className="font-semibold">{l.title}</p>
          <p>Status: {l.state}</p>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/listings/${l.id}`}>
                View
              </Link>
            </Button>

            {l.id && (
              l.state === "ACTIVE" ? (
                <Button
                  variant="outline"
                  onClick={() => setVisibility(String(l.id), false)}
                >
                  Make Private
                </Button>
              ) : (
                <Button onClick={() => setVisibility(String(l.id), true)}>
                  Publish
                </Button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
