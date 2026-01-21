
"use client";
import Header from "@/components/layout/Header";

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
import { SidebarProvider } from "@/components/ui/sidebar";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function SellerListings() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Partial<Listing>[]>([]);

  useEffect(() => {
    if (!user || !profile?.isSeller || profile?.status !== "ACTIVE" || !db) return;
    // Enforce check at call site
    if (!profile?.isSeller || profile.status !== "ACTIVE") return;
    const q = query(
      collection(db!, "listings"),
      where("ownerUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<Listing>) })));
    });

    return () => unsub();
  }, [user, profile]);

  const setVisibility = async (listingId: string, makePublic: boolean) => {
    if (!user || profile?.status !== "ACTIVE" || !db) return;
    // Enforce check at call site
    if (profile.status !== "ACTIVE") return;
    try {
      await updateDoc(doc(db!, "listings", listingId), {
        state: makePublic ? "ACTIVE" : "DRAFT",
        status: makePublic ? "ACTIVE" : "DRAFT",
        updatedAt: serverTimestamp(),
      });
      toast({ title: makePublic ? "Published" : "Made private" });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: getFriendlyErrorMessage(e) || "Could not update listing visibility.",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (listing: Partial<Listing> & { id?: string }) => {
    const listingId = String(listing.id || "");
    if (!listingId) return;

    const state = String((listing as any).state || (listing as any).status || "");
    const upper = state.toUpperCase();

    if (upper === "SOLD" || upper === "SOLD_OUT") {
      toast({
        title: "This listing is sold",
        description: getFriendlyErrorMessage(null) || "Sold listings can't be unpublished.",
        variant: "destructive",
      });
      return;
    }

    const isPublic = upper === "ACTIVE";
    await setVisibility(listingId, !isPublic);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 p-6 max-w-5xl mx-auto">
          <Header />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">Your Listings</h1>
            <Button asChild size="sm" className="comic-button">
              <Link href="/listings/create">Create Listing</Link>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            Click a listing card to toggle Publish / Private.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => {
              const state = String((l as any).state || (l as any).status || "");
              const upper = state.toUpperCase();
              const isPublic = upper === "ACTIVE";
              return (
                <button
                  key={String(l.id)}
                  type="button"
                  onClick={() => togglePublish(l)}
                  className="text-left rounded-xl border-2 border-black bg-card/80 hover:bg-card transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold leading-snug line-clamp-2">
                          {l.title || "Untitled listing"}
                        </div>
                        <div className="mt-1 text-sm font-bold text-primary">
                          ${Number((l as any).price || 0).toFixed(2)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          isPublic
                            ? "border-green-500/40 bg-muted/40"
                            : "border-red-500/40 bg-muted/40"
                        }
                      >
                        {isPublic ? "Published" : "Private"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/listings/${l.id}`}>View</Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/listings/${l.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublish(l);
                        }}
                      >
                        {isPublic ? "Make Private" : "Publish"}
                      </Button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
