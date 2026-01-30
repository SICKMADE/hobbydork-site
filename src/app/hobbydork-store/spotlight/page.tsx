"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StoreCard from "@/components/StoreCard";
import { useCollection } from "@/firebase";
import { useMemo } from "react";
import { collection, getFirestore, query, where } from "firebase/firestore";
import { spotlightConverter, storeConverter } from "@/firebase/firestore/converters";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";

export default function SpotlightPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const firestore = getFirestore();
  // Query spotlight slots that are active and current
  const now = new Date();
  const slotsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "spotlightSlots").withConverter(spotlightConverter),
      where("active", "==", true),
      where("startAt", "<=", now),
      where("endAt", ">=", now)
    );
  }, [firestore, now]);
  const { data: slots, isLoading: slotsLoading } = useCollection(slotsQuery);

  // Fetch all spotlighted stores
  const [stores, setStores] = useState<any[]>([]);
  useEffect(() => {
    if (!firestore || !slots || slots.length === 0) {
      setStores([]);
      return;
    }
    const fetchStores = async () => {
      const storeIds = slots.map((slot) => slot.storeId);
      if (storeIds.length === 0) return setStores([]);
      const storeDocs = await Promise.all(
        storeIds.map(async (id) => {
          const ref = collection(firestore, "stores").withConverter(storeConverter);
          const q = query(ref, where("storeId", "==", id));
          const snap = await (await import("firebase/firestore")).getDocs(q);
          return snap.docs[0]?.data();
        })
      );
      setStores(storeDocs.filter(Boolean));
    };
    fetchStores();
  }, [firestore, slots]);

  // Determine if current user is eligible to purchase a spotlight slot
  const isSeller = !!userData?.isSeller && !!userData?.storeId;
  const alreadySpotlighted = stores.some(
    (store) => store?.storeId === userData?.storeId
  );

  // Handle Stripe checkout for spotlight purchase
  async function handlePurchaseSpotlight() {
    setLoading(true);
    try {
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");
      const spotlightPriceCents = 1500; // $15 for 1 week
      const { data } = await createCheckoutSession({
        orderId: `spotlight-${userData.storeId}-${Date.now()}`,
        listingTitle: `Store Spotlight: ${userData.storeId}`,
        amountCents: spotlightPriceCents,
        appBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
        spotlightStoreId: userData.storeId,
      });
      if (data && typeof data === "object" && "url" in data && typeof (data as { url: unknown }).url === "string") {
        window.location.href = (data as { url: string }).url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err?.message || "Could not start checkout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-primary">Store Spotlight</h1>
        {/* Seller purchase spotlight button */}
        {isSeller && !alreadySpotlighted && (
          <div className="mb-8 flex flex-col items-center">
            <Button
              onClick={handlePurchaseSpotlight}
              disabled={loading}
              className="comic-button bg-yellow-400 text-black border-yellow-600 hover:bg-yellow-300"
              aria-label="Purchase Store Spotlight"
            >
              {loading ? "Processing..." : "Purchase Spotlight ($15/week)"}
            </Button>
            <div className="text-xs text-muted-foreground mt-2 text-center max-w-md">
              Your store will be featured in the spotlight section for 7 days. Only one spotlight slot per store at a time.
            </div>
          </div>
        )}
        {slotsLoading && !slots ? (
          <div className="text-center text-lg text-muted-foreground">Loading spotlighted stores…</div>
        ) : stores.length === 0 ? (
          <Card className="border-2 border-dashed border-primary bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">No Spotlighted Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg text-muted-foreground py-6 text-center">
                There are currently no stores in the spotlight.<br />
                Sellers can purchase a spotlight slot to be featured here!
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stores.map((store) => (
              <StoreCard key={store.storeId} store={store} layout="spotlight" />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
