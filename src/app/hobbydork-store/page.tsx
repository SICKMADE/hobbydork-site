"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";

export default function HobbyDorkStorePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "ADMIN";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">HobbyDork Store</h1>
        <p className="text-muted-foreground mb-6">
          Welcome to the official HobbyDork Store! Purchase store spotlight slots, custom themes, layouts, and more to enhance your shop.
        </p>

        <div className="space-y-6">
          <Card className="border-2 border-primary shadow-md bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Store Spotlight Slot</CardTitle>
                {isAdmin && <Badge variant="outline" className="bg-primary text-white">Admin</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Get featured on the homepage and attract more buyers to your store.</p>
              <Button asChild>
                <Link href="/hobbydork-store/spotlight">Buy Spotlight Slot</Link>
              </Button>
              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary">Manage Slots</Button>
                  <Button variant="destructive">View Purchases</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-primary shadow-md bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Store Theme</CardTitle>
                {isAdmin && <Badge variant="outline" className="bg-primary text-white">Admin</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Stand out with a unique look for your store. Choose from premium themes or request a custom design.</p>
              <Button asChild>
                <Link href="/hobbydork-store/themes">Browse Themes</Link>
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
              <Button asChild>
                <Link href="/hobbydork-store/layouts">View Layout Options</Link>
              </Button>
              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary">Manage Layouts</Button>
                  <Button variant="destructive">View Layout Orders</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
