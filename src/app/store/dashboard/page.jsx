"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { db, functions } from "@/firebase/client-provider";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

function getListingImage(listing) {
  if (!listing) return null;
  if (listing.primaryImageUrl) return listing.primaryImageUrl;
  if (Array.isArray(listing.imageUrls) && listing.imageUrls[0]) return listing.imageUrls[0];
  if (Array.isArray(listing.images) && listing.images[0]) return listing.images[0];
  return null;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    activeListings: 0,
    soldListings: 0,
  });

  const [activeListings, setActiveListings] = useState([]);
  const [soldListings, setSoldListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [seller, setSeller] = useState(null);
  const [stripeStatus, setStripeStatus] = useState("NONE");

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        // Load seller account
        const sellerRef = doc(db, "users", user.uid);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          setSeller(sellerData);

          if (!sellerData.stripeAccountId) {
            setStripeStatus("NONE");
          } else {
            setStripeStatus("CONNECTED");
          }
        }

        // Load listings
        const activeQ = query(
          collection(db, "listings"),
          where("ownerUid", "==", user.uid),
          where("state", "==", "ACTIVE")
        );
        const soldQ = query(
          collection(db, "listings"),
          where("ownerUid", "==", user.uid),
          where("state", "==", "SOLD")
        );

        const activeSnap = await getDocs(activeQ);
        const soldSnap = await getDocs(soldQ);

        const activeData = activeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const soldData = soldSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setActiveListings(activeData);
        setSoldListings(soldData);

        // Load orders (GROSS revenue)
        const orderQ = query(
          collection(db, "orders"),
          where("sellerUid", "==", user.uid)
        );
        const orderSnap = await getDocs(orderQ);

        const orderData = orderSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOrders(orderData);

        // Compute stats
        const revenue = orderData.reduce((sum, o) => {
          const value = Number(o.totalPrice ?? o.price ?? 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        const salesCount = orderData.length;

        setStats({
          totalRevenue: revenue,
          totalSales: salesCount,
          activeListings: activeData.length,
          soldListings: soldData.length,
        });

      } catch (err) {
        toast({ title: "Error", description: err?.message ?? "Failed to load seller dashboard." });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  async function startStripeOnboarding() {
    if (!user) return;

    try {
      const onboard = httpsCallable(functions, "onboardStripe");
      const result = await onboard({});
      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast({
          title: "Stripe Error",
          description: "Unable to start onboarding.",
        });
      }
    } catch (error) {
      toast({
        title: "Stripe Error",
        description: error.message || "Unable to start onboarding.",
      });
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="p-6">You must sign in to view the dashboard.</div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading dashboard…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your store performance.</p>
        </div>

        <Card className="border border-red-500/30 bg-muted/40">
          <CardHeader>
            <CardTitle>Stripe Account</CardTitle>
            <CardDescription>Connect Stripe to receive payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            {stripeStatus === "NONE" ? (
              <div className="space-y-2">
                <div className="text-sm text-destructive">You must connect Stripe to receive payments.</div>
                <Button onClick={startStripeOnboarding}>Connect Stripe</Button>
              </div>
            ) : (
              <div className="text-sm">Stripe account connected.</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(stats.totalRevenue || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sold Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.soldListings}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="text-sm text-muted-foreground">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((o) => (
                <Card key={o.id}>
                  <CardContent className="py-4 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold truncate">{o.title || o.listingTitle || "Order"}</div>
                      <div className="text-sm font-bold">${Number(o.totalPrice ?? o.price ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Status: {o.status || ""}</div>
                    <div className="text-xs text-muted-foreground">Buyer: {o.buyerUid || ""}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Active Listings</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/listings/create">Create Listing</Link>
            </Button>
          </div>

          {activeListings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active listings.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activeListings.map((l) => {
                const imageUrl = getListingImage(l);
                return (
                  <Link key={l.id} href={`/listings/${l.id}`} className="block">
                    <Card className="h-full hover:bg-muted/60 transition-colors">
                      <CardContent className="p-3 space-y-2">
                        {imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} className="w-full h-40 object-cover rounded" alt={l.title || "Listing"} />
                        )}
                        <div className="font-semibold line-clamp-2">{l.title}</div>
                        <div className="text-sm font-bold">${Number(l.price || 0).toFixed(2)}</div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Sold Listings</h2>
          {soldListings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No sold listings.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {soldListings.map((l) => {
                const imageUrl = getListingImage(l);
                return (
                  <Link key={l.id} href={`/listings/${l.id}`} className="block">
                    <Card className="h-full hover:bg-muted/60 transition-colors">
                      <CardContent className="p-3 space-y-2">
                        {imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} className="w-full h-40 object-cover rounded" alt={l.title || "Listing"} />
                        )}
                        <div className="font-semibold line-clamp-2">{l.title}</div>
                        <div className="text-sm font-bold">${Number(l.price || 0).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">SOLD</div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
