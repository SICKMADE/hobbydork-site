"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase/client-provider";
import {
  doc,
  getDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client-provider";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listingId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function load() {
      // Load listing
      const listingRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingRef);

      if (!listingSnap.exists()) {
        setLoading(false);
        return;
      }

      const listingData = { id: listingSnap.id, ...listingSnap.data() };
      setListing(listingData);

      // Load seller
      const sellerRef = doc(db, "users", listingData.userId);
      const sellerSnap = await getDoc(sellerRef);

      if (sellerSnap.exists()) {
        setSeller({ id: sellerSnap.id, ...sellerSnap.data() });
      }

      setLoading(false);
    }

    load();
  }, [listingId]);

  async function handleBuyNow() {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "You must login to purchase this item.",
      });
      return router.push("/onboarding");
    }

    if (user.uid === listing.userId) {
      toast({
        title: "Not Allowed",
        description: "You cannot buy your own listing.",
      });
      return;
    }

    if (!seller?.stripeAccountId) {
      toast({
        title: "Seller Not Ready",
        description: "This seller has not completed Stripe onboarding.",
      });
      return;
    }

    setBuying(true);

    // Create order in Firestore
    const orderRef = await addDoc(collection(db, "orders"), {
      listingId: listing.id,
      buyerId: user.uid,
      sellerId: listing.sellerId,
      title: listing.title,
      price: listing.price,
      state: "CREATED",
      createdAt: new Date(),
    });
    const orderId = orderRef.id;

    // Call Firebase Function
    const createCheckout = httpsCallable(functions, "createCheckoutSession");
    const result = await createCheckout({
      orderId,
      listingTitle: listing.title,
      amountCents: Math.round(listing.price * 100),
    });

    setBuying(false);

    if (result.data?.url) {
      window.location.href = result.data.url;
    } else {
      toast({
        title: "Checkout Error",
        description: "Could not start checkout.",
      });
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!listing) {
    return <div className="p-6">Listing not found.</div>;
  }

  // SOLD banner
  const isSold = listing.status === "SOLD";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* Image gallery */}
      <div className="w-full">
        {listing.images?.length > 0 ? (
          <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-64 rounded-lg bg-gray-200 flex items-center justify-center">
            No Image
          </div>
        )}
      </div>

      {/* Title + Price */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{listing.title}</h1>

        <p className="text-2xl font-semibold text-green-600">
          ${listing.price}
        </p>

        {isSold && (
          <span className="inline-block px-3 py-1 rounded bg-red-600 text-white font-semibold">
            SOLD
          </span>
        )}
      </div>

      {/* Description */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Description</h2>
        <p className="text-gray-700 whitespace-pre-line">
          {listing.description || "No description provided."}
        </p>
      </div>

      {/* Seller info */}
      {seller && (
        <div className="border rounded p-4 space-y-1 bg-gray-50">
          <p className="font-semibold">Seller</p>
          <p>{seller.displayName || "Anonymous"}</p>

          {seller.stripeAccountId ? (
            <p className="text-green-600 text-sm">Stripe Verified Seller</p>
          ) : (
            <p className="text-red-600 text-sm">Not Stripe Verified</p>
          )}
        </div>
      )}

      {/* Buy button */}
      {!isSold && (
        <Button
          onClick={handleBuyNow}
          disabled={buying}
          className="w-full text-white bg-blue-600 hover:bg-blue-700"
        >
          {buying ? "Processing…" : "Buy Now"}
        </Button>
      )}

      {isSold && (
        <Button disabled className="w-full bg-gray-400 text-white">
          SOLD OUT
        </Button>
      )}
    </div>
  );
}
