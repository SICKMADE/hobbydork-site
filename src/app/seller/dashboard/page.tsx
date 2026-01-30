"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { db, functions } from "@/firebase/client-provider";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import "@/styles/grid-bg-dark.css";
// SidebarProvider already imported above if present; remove duplicate import
import SellerSalesCharts from "@/components/dashboard/SellerSalesCharts";
import SellerNotifications from "@/components/dashboard/SellerNotifications";
import SellerPerformance from "@/components/dashboard/SellerPerformance";
import SellerOrders from "@/components/dashboard/SellerOrders";
import SellerAuctions from "@/components/dashboard/SellerAuctions";
import SellerListings from "@/components/dashboard/SellerListings";
import SellerTodos from "@/components/dashboard/SellerTodos";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function SellerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const [stripeStatus, setStripeStatus] = useState<"NONE" | "CONNECTED">("NONE");
  const [stripeDetails, setStripeDetails] = useState<any>(null);

  const [balance, setBalance] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const [blindBidderAuctions, setBlindBidderAuctions] = useState<any[]>([]);

  // -------------------------------
  // FETCH STRIPE + PAYOUT DATA
  // -------------------------------
  useEffect(() => {
    if (!user || !functions || !db) return;

    const run = async () => {
      try {
        const userSnap = await getDoc(doc(db!, "users", user.uid));
        const userData = userSnap.data();

        if (!userData?.stripeAccountId) {
          setStripeStatus("NONE");
          return;
        }

        setStripeStatus("CONNECTED");

        const getStripeAccount = httpsCallable(functions!, "getStripeAccount");
        const getStripePayouts = httpsCallable(functions!, "getStripePayouts");

        const account: any = await getStripeAccount({ accountId: userData.stripeAccountId });
        const payoutData: any = await getStripePayouts({ accountId: userData.stripeAccountId });

        setStripeDetails({
          email: account.data?.email,
          chargesEnabled: account.data?.charges_enabled,
          payoutsEnabled: account.data?.payouts_enabled,
          dashboardUrl: account.data?.dashboardUrl,
        });

        setBalance(payoutData.data?.balance);
        setPayouts(payoutData.data?.payouts || []);
      } catch (e) {
        toast({
          title: "Failed to load Stripe data",
          description: getFriendlyErrorMessage(e) || "Could not load Stripe data.",
          variant: "destructive",
        });
      } finally {
        setLoadingPayouts(false);
      }
    };

    setLoadingPayouts(true);
    run();
  }, [user]);

  // -------------------------------
  // AUTH GUARDS
  // -------------------------------
  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen items-center justify-center">Loading…</div>
      </SidebarProvider>
    );
  }

  // Seller permission check
  if (!user || !profile?.isSeller || profile?.status !== "ACTIVE") {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="p-8 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Seller Access Required</CardTitle>
              <CardDescription>
                You must be an approved seller to view this page. If you believe this is an error, please contact support or refresh your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild><Link href="/become-seller">Become a Seller</Link></Button>
            </CardContent>
          </Card>
        </div>
      </SidebarProvider>
    );
  }

  // -------------------------------
  // DERIVED ACTION FLAGS
  // -------------------------------
  const stripeBlocked =
    stripeStatus === "CONNECTED" &&
    (!stripeDetails?.chargesEnabled || !stripeDetails?.payoutsEnabled);

  const openBlindBidder = blindBidderAuctions.filter(a => a.status === "OPEN");

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <AppLayout sidebarComponent={<SellerSidebar />}>
      <div className="flex flex-col items-center mb-8">
        <img
          src="/SELLERDASHBOARD.png"
          alt="Seller Dashboard"
          width={412}
          height={212}
          className="w-78 h-28 object-contain mb-2 drop-shadow-lg"
          loading="eager"
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-extrabold">{profile?.displayName || user.email || 'Seller'}</span>
          {(() => {
            const tier = (typeof profile?.sellerTier === 'string' ? profile.sellerTier : 'BRONZE').toUpperCase();
            let className = 'ml-1 px-2 py-0.5 rounded-full text-[12px] font-semibold tracking-wider uppercase border shadow-inner';
            if (tier === 'GOLD') {
              className += ' border-yellow-400 seller-tier-gold';
            } else if (tier === 'SILVER') {
              className += ' border-gray-400 seller-tier-silver';
            } else {
              className += ' border-orange-400 seller-tier-bronze';
            }
            return <span className={className}>{tier} SELLER</span>;
          })()}
            </div>
          </div>
          {/* Render main dashboard content here, navigation is now handled by SellerSidebar */}
          {/* Example: Default to overview/dashboard content, or use router to switch sections */}
          <Card className="mb-6 border-2 border-black bg-card/80 shadow">
            <CardHeader>
              <CardTitle>Money &amp; Payouts</CardTitle>
              <CardDescription>Your Stripe balance and payout status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="rounded-lg bg-muted p-4 flex flex-col items-center">
                  <div className="text-sm text-muted-foreground">Available</div>
                  <div className="text-2xl font-bold">${((balance?.available?.[0]?.amount ?? 0) / 100).toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-muted p-4 flex flex-col items-center">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold">${((balance?.pending?.[0]?.amount ?? 0) / 100).toFixed(2)}</div>
                </div>
                <div className="flex flex-col gap-2 items-center justify-center">
                  {stripeBlocked ? (
                    <Button asChild variant="destructive">
                      <Link href="/seller/stripe">Fix Stripe Setup</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <a
                        href={stripeDetails?.dashboardUrl || "https://dashboard.stripe.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Withdraw / Manage Stripe
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="font-semibold mb-2 mt-4">Recent Payouts</div>
              {payouts.length === 0 ? (
                <div className="text-muted-foreground">No payouts yet.</div>
              ) : (
                <ul className="space-y-2">
                  {payouts.map((p: any) => (
                    <li key={p.id} className="border rounded-lg p-4 bg-background/80 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="font-bold text-lg">${(p.amount / 100).toFixed(2)}</div>
                      <div className="text-sm">Status: <span className="font-medium">{p.status}</span></div>
                      <div className="text-sm">Arrival: <span className="font-medium">{p.arrival_date ? new Date(p.arrival_date * 1000).toLocaleDateString() : "—"}</span></div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {(stripeBlocked || openBlindBidder.length > 0) && (
            <Card className="border-red-500 mb-6">
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stripeBlocked && (
                  <div className="text-red-600 font-semibold">
                    Stripe account incomplete — payouts blocked
                  </div>
                )}
                {openBlindBidder.length > 0 && (
                  <div className="font-semibold">
                    {openBlindBidder.length} BlindBidder auction(s) currently open
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SellerPerformance sellerUid={user.uid} />
            </CardContent>
          </Card>
          {/* Add more dashboard content as needed, navigation is now sidebar-driven */}
          {/* End main dashboard content */}
        {/* Add more dashboard content as needed, navigation is now sidebar-driven */}
    </AppLayout>
  );
}