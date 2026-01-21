"use client";

import { useAuth } from "@/hooks/use-auth";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function SellerPayouts() {
  const { profile } = useAuth();

  if (!profile?.isSeller || profile?.status !== "ACTIVE") {
    return (
      <SidebarProvider>
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
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <SellerSidebar />
        <main className="flex-1 p-6 max-w-3xl mx-auto">
          <Header />
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
      </div>
    </SidebarProvider>
  );
}
