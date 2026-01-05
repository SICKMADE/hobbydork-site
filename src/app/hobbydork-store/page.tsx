"use client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { httpsCallable } from "firebase/functions";

import { useToast } from "@/hooks/use-toast";
import { useFirebaseApp } from "@/firebase/provider";
import { getFunctions } from "firebase/functions";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";

export default function HobbyDorkStorePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "ADMIN";

  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleBuy({
    orderId,
    listingTitle,
    amountCents,
  }: { orderId: string; listingTitle: string; amountCents: number }) {
    setLoading(orderId);
    try {
      const functions = getFunctions(firebaseApp, 'us-central1');
      const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");
      const { data } = await createCheckoutSession({
        orderId,
        listingTitle,
        amountCents,
        appBaseUrl: window.location.origin,
      });
      if (data && typeof data === "object" && "url" in data && typeof (data as { url: unknown }).url === "string") {
        window.location.href = (data as { url: string }).url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      let message = "Could not start checkout.";
      if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
        message = (err as { message: string }).message;
      }
      toast({
        title: "Checkout failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <AppLayout>
      <div>
        <Card className="border-2 border-primary shadow-md bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Custom Store Theme</CardTitle>
              {isAdmin && <Badge variant="outline" className="bg-primary text-white">Admin</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Stand out with a unique look for your store. Choose from premium themes or request a custom design.</p>
            <Button
              onClick={() => handleBuy({
                orderId: "theme-" + Date.now(),
                listingTitle: "Custom Store Theme",
                amountCents: 1000,
              })}
              disabled={!!loading}
            >
              {loading === "theme" ? "Processing..." : "Buy Theme ($10)"}
            </Button>
            {isAdmin && (
              <div className="mt-4 flex gap-2">
                <Button variant="secondary">Manage Themes</Button>
                <Button variant="destructive">View Theme Orders</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-primary shadow-md bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Custom Store Layout</CardTitle>
              {isAdmin && <Badge variant="outline" className="bg-primary text-white">Admin</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Upgrade your store layout for better buyer experience and more sales.</p>
            <Button
              onClick={() => handleBuy({
                orderId: "layout-" + Date.now(),
                listingTitle: "Custom Store Layout",
                amountCents: 1200,
              })}
              disabled={!!loading}
            >
              {loading === "layout" ? "Processing..." : "Buy Layout ($12)"}
            </Button>
            {isAdmin && (
              <div className="mt-4 flex gap-2">
                <Button variant="secondary">Manage Layouts</Button>
                <Button variant="destructive">View Layout Orders</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Separator className="my-8" />
            <div className="bg-primary/10 border border-primary rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-2 text-primary">Admin Controls</h2>
              <p className="mb-4 text-muted-foreground">Manage all HobbyDork Store products, orders, and settings from here.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Dashboard</Button>
                <Button variant="secondary">Product Settings</Button>
                <Button variant="secondary">Order Management</Button>
                <Button variant="secondary">User Purchases</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
