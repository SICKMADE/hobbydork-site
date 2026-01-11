"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { db, functions, storage } from "@/firebase/client-provider";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";

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
  const [storefront, setStorefront] = useState(null);
  const [newStoreImageFile, setNewStoreImageFile] = useState(null);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        if (!db) return;
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

          if (sellerData.storeId) {
            const storeRef = doc(db, "stores", sellerData.storeId);
            const storeSnap = await getDoc(storeRef);
            if (storeSnap.exists()) {
              setStorefront({ id: storeSnap.id, ...storeSnap.data() });
            } else {
              setStorefront(null);
            }
          } else {
            setStorefront(null);
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
        toast({ title: "Could not load dashboard", description: "Something went wrong. Please try again. If the problem continues, contact support." });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  async function uploadStoreImage() {
    if (!user || !seller?.storeId) return;
    if (!newStoreImageFile) return;
    if (!storage) {
      toast({ title: "Uploads unavailable", description: "Storage is not ready yet.", variant: "destructive" });
      return;
    }

    setUploadingStoreImage(true);
    try {
      const safeName = String(newStoreImageFile.name || "store-image").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `storeImages/${user.uid}/${seller.storeId}/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, newStoreImageFile);
      const url = await getDownloadURL(storageRef);

      if (!db) return;
      const storeRef = doc(db, "stores", seller.storeId);
      await updateDoc(storeRef, { storeImageUrl: url, updatedAt: serverTimestamp() });

      setStorefront((prev) => (prev ? { ...prev, storeImageUrl: url } : prev));
      setNewStoreImageFile(null);
      toast({ title: "Store image updated" });
    } catch (err) {
      toast({ title: "Could not upload image", description: "Something went wrong. Please try again. If the problem continues, contact support.", variant: "destructive" });
    } finally {
      setUploadingStoreImage(false);
    }
  }

  async function startStripeOnboarding() {
    if (!user) return;

    try {
      const onboard = httpsCallable(functions, "onboardStripe");
      const result = await onboard({});
      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast({
          title: "Could not start Stripe onboarding",
          description: "Something went wrong. Please try again. If the problem continues, contact support.",
        });
      }
    } catch (error) {
      toast({
        title: "Could not start Stripe onboarding",
        description: "Something went wrong. Please try again. If the problem continues, contact support.",
      });
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="text-4xl mb-2">🔒</div>
          <div className="font-semibold text-lg mb-2">Sign in to view your dashboard</div>
          <div className="text-muted-foreground mb-4">You must sign in to view your seller dashboard.</div>
          <Button asChild className="comic-button">
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <div className="font-semibold text-lg mb-2">Loading your dashboard…</div>
        </div>
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

        <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Stripe Account</CardTitle>
            <CardDescription>Connect Stripe to receive payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            {stripeStatus === "NONE" ? (
              <div className="space-y-2 flex flex-col items-start">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <span className="text-xl">⚠️</span>
                  <span>You must connect Stripe to receive payments.</span>
                </div>
                <Button onClick={startStripeOnboarding} className="comic-button">Connect Stripe</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-success-foreground">
                <span className="text-xl">✅</span>
                <span>Stripe account connected.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {seller?.storeId && (
          <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <CardHeader>
              <CardTitle>Store Image</CardTitle>
              <CardDescription>
                This is the big banner-style image shown on your store page and store cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {storefront?.storeImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storefront.storeImageUrl}
                  alt="Current store image"
                  className="w-full max-h-[260px] object-contain rounded-md border-2 border-black bg-muted"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xl">🖼️</span>
                  <span>No store image uploaded yet.</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewStoreImageFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  className="comic-button"
                  disabled={uploadingStoreImage || !newStoreImageFile}
                  onClick={uploadStoreImage}
                >
                  {uploadingStoreImage ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(stats.totalRevenue || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
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
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <div className="text-3xl mb-2">📭</div>
              <div>No orders yet.</div>
              <div className="mt-2 text-xs">When you make a sale, your orders will appear here.</div>
            </div>
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
            <Button asChild variant="outline" size="sm" className="border-2 border-black bg-muted/40 hover:bg-muted/60">
              <Link href="/listings/create">Create Listing</Link>
            </Button>
          </div>

          {activeListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <div className="text-3xl mb-2">📦</div>
              <div>No active listings.</div>
              <div className="mt-2 text-xs">Ready to sell something? <Link href="/listings/create" className="underline">Create your first listing</Link>.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activeListings.map((l) => {
                const imageUrl = getListingImage(l);
                return (
                  <Link key={l.id} href={`/listings/${l.id}`} className="block">
                    <Card className="h-full border-2 border-black bg-card/80 hover:bg-card transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
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
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <div className="text-3xl mb-2">🕒</div>
              <div>No sold listings yet.</div>
              <div className="mt-2 text-xs">Once you sell something, your sold listings will show up here.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {soldListings.map((l) => {
                const imageUrl = getListingImage(l);
                return (
                  <Link key={l.id} href={`/listings/${l.id}`} className="block">
                    <Card className="h-full border-2 border-black bg-card/80 hover:bg-card transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
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
