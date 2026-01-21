"use client";
import ThemeSelector from "./ThemeSelector";


import SellerSidebar from "@/components/dashboard/SellerSidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function SellerSettings() {
  const { user, profile } = require("@/hooks/use-auth").useAuth();
  if (!user || !user.emailVerified || profile?.status !== "ACTIVE" || !profile?.isSeller) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="p-8 max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Seller Access Required</CardTitle>
              <CardDescription>
                You must be an active, verified seller to access seller settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/become-seller" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Become a Seller</a>
            </CardContent>
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
              <CardTitle>Seller Settings</CardTitle>
              <CardDescription>
                HobbyDork is committed to safety, transparency, and minimal seller fees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600 text-sm mb-4">
                Choose your store theme below. Only themes you own are available.
              </div>
              <ThemeSelector userId={user.uid} />
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
