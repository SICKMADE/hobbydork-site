"use client";

import { useAuth } from "@/hooks/use-auth";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import "@/styles/grid-bg-dark.css";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function SellerPayouts() {
  const { profile } = useAuth();

  if (!profile?.isSeller || profile?.status !== "ACTIVE") {
    return (
      <AppLayout sidebarComponent={<SellerSidebar />}>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="p-8 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Seller Access Required</CardTitle>
              <CardDescription>
                You must be an approved seller to view payouts. If you believe this is an error, please contact support or refresh your profile.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout sidebarComponent={<SellerSidebar />}>
      <main className="flex-1 p-6 max-w-6xl mx-auto bg-grid-dark">
        <Header />
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
            <span className="text-lg font-extrabold">{profile?.displayName || 'Seller'}</span>
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
        <Card className="border-2 border-black bg-card/80 shadow">
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>
              HobbyDork uses secure Stripe payouts. All earnings are transferred directly to your Stripe account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="font-semibold">Stripe Account ID:</span>
              <span className="font-mono ml-2">{profile?.stripeAccountId || "Not connected"}</span>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">
              Visit your Stripe Dashboard for full payout details.
            </div>
            <a
              href="https://dashboard.stripe.com/"
              className="inline-block mt-2 px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/80 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Stripe Dashboard
            </a>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
