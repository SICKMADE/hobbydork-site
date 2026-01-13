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
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

// --- TypeScript interfaces ---
interface ListingDoc {
  id: string;
  title?: string;
  price?: number;
  primaryImageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  state?: string;
}

interface OrderDoc {
  id: string;
  totalPrice?: number;
  price?: number;
  status?: string;
  buyerUid?: string;
  title?: string;
  listingTitle?: string;
}

interface SellerDoc {
  storeId?: string;
  stripeAccountId?: string;
}

interface StorefrontDoc {
  id?: string;
  storeId?: string;
  storeName?: string;
  storeImageUrl?: string;
}

function getListingImage(listing: ListingDoc) {
  if (!listing) return null;
  if (listing.primaryImageUrl) return listing.primaryImageUrl;
  if (Array.isArray(listing.imageUrls) && listing.imageUrls[0]) return listing.imageUrls[0];
  if (Array.isArray(listing.images) && listing.images[0]) return listing.images[0];
  return null;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<{ totalRevenue: number; totalSales: number; activeListings: number; soldListings: number }>({
    totalRevenue: 0,
    totalSales: 0,
    activeListings: 0,
    soldListings: 0,
  });
  const [activeListings, setActiveListings] = useState<ListingDoc[]>([]);
  const [soldListings, setSoldListings] = useState<ListingDoc[]>([]);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [seller, setSeller] = useState<SellerDoc | null>(null);
  const [stripeStatus, setStripeStatus] = useState<string>("NONE");
  const [storefront, setStorefront] = useState<StorefrontDoc | null>(null);
  const [newStoreImageFile, setNewStoreImageFile] = useState<File | null>(null);
  const [uploadingStoreImage, setUploadingStoreImage] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.uid) return;
    async function load() {
      try {
        if (!db || !user?.uid) return;
        // Load seller account
        const sellerRef = doc(db, "users", user.uid);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data() as SellerDoc;
          setSeller(sellerData);
          setStripeStatus(sellerData.stripeAccountId ? "CONNECTED" : "NONE");
          if (sellerData.storeId) {
            const storeRef = doc(db, "stores", sellerData.storeId);
            const storeSnap = await getDoc(storeRef);
            setStorefront(storeSnap.exists() ? { ...(storeSnap.data() as StorefrontDoc), id: storeSnap.id } : null);
          } else {
            setStorefront(null);
          }
        }
        // Listings
        const activeQ = query(collection(db, "listings"), where("ownerUid", "==", user.uid), where("state", "==", "ACTIVE"));
        const soldQ = query(collection(db, "listings"), where("ownerUid", "==", user.uid), where("state", "==", "SOLD"));
        const activeSnap = await getDocs(activeQ);
        const soldSnap = await getDocs(soldQ);
        setActiveListings(activeSnap.docs.map((d) => ({ ...(d.data() as ListingDoc), id: d.id })));
        setSoldListings(soldSnap.docs.map((d) => ({ ...(d.data() as ListingDoc), id: d.id })));
        // Orders
        const orderQ = query(collection(db, "orders"), where("sellerUid", "==", user.uid));
        const orderSnap = await getDocs(orderQ);
        const orderData: OrderDoc[] = orderSnap.docs.map((d) => ({ ...(d.data() as OrderDoc), id: d.id }));
        setOrders(orderData);
        // Stats
        setStats({
          totalRevenue: orderData.reduce((sum, o) => sum + Number(o.totalPrice ?? o.price ?? 0), 0),
          totalSales: orderData.length,
          activeListings: activeSnap.docs.length,
          soldListings: soldSnap.docs.length,
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
    if (!user?.uid || !seller?.storeId || !newStoreImageFile || !storage) return;
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
    if (!user?.uid) return;
    try {
      const onboard = httpsCallable(functions!, "onboardStripe");
      const result = await onboard({});
      const data = result.data as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Could not start Stripe onboarding", description: "Something went wrong. Please try again. If the problem continues, contact support." });
      }
    } catch (error) {
      toast({ title: "Could not start Stripe onboarding", description: "Something went wrong. Please try again. If the problem continues, contact support." });
    }
  }

  if (!user) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background items-center justify-center">
          <SellerSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-background/90 p-8 rounded-2xl custom-btn-shadow border-4 border-primary text-center">
              <h1 className="text-2xl font-bold mb-2 text-white">Sign in to view your dashboard</h1>
              <Button asChild className="comic-button"><a href="/login">Sign In</a></Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }
  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background items-center justify-center">
          <SellerSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-background/90 p-8 rounded-2xl custom-btn-shadow border-4 border-primary text-center">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <div className="font-semibold text-lg mb-2">Loading your dashboard…</div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 flex items-center justify-center p-2 bg-grid bg-[length:150px_150px] bg-center">
          <div className="max-w-5xl w-full flex flex-col gap-8 rounded-2xl border-2 border-destructive bg-background/95 p-8 md:p-12">
            <div className="flex flex-col items-center mb-2">
              <img src="/SELLERDASHBOARD.png" alt="Seller Dashboard" className="w-78 h-28 object-contain mb-2 drop-shadow-lg" />
            </div>
            <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle>
                  <Link href="/seller/stripe" className="hover:underline">Stripe Account</Link>
                </CardTitle>
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
            {/* Store image changer removed from dashboard. Should be editable in My Store page. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/seller-analytics" className="contents">
                <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] cursor-pointer hover:bg-primary/10 transition">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total Revenue</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">${Number(stats.totalRevenue || 0).toFixed(2)}</div></CardContent>
                </Card>
              </Link>
              <Link href="/sales" className="contents">
                <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] cursor-pointer hover:bg-primary/10 transition">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total Sales</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats.totalSales}</div></CardContent>
                </Card>
              </Link>
              <Link href="/seller/listings" className="contents">
                <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] cursor-pointer hover:bg-primary/10 transition">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Active Listings</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats.activeListings}</div></CardContent>
                </Card>
              </Link>
              <Link href="/seller/listings?sold=1" className="contents">
                <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)] cursor-pointer hover:bg-primary/10 transition">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Sold Listings</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats.soldListings}</div></CardContent>
                </Card>
              </Link>
            </div>
            {/* Remove everything below stats shortcuts */}
            {/* End of dashboard content */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
