"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const role = profile?.role;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <h1 className="text-2xl font-bold">ADMIN DASHBOARD</h1>
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </AppLayout>
    );
  }

  // AdminLayout should already block, but keep this safe.
  if (!isAdmin && !isModerator) {
    return (
      <AppLayout>
        <div className="p-6">You do not have access.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8 space-y-8">
        {/* Admin Dashboard Header (no PNG) */}
        <div className="flex flex-col items-center mb-4">
          <h1
            className="text-3xl font-extrabold tracking-tight text-center riffic-header"
          >
            ADMIN DASHBOARD
          </h1>
          <p className="text-base text-muted-foreground text-center mt-1">Moderation and site management tools</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Moderation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="comic-button" size="lg"><Link href="/admin/moderation">Moderation Queue</Link></Button>
              <Button asChild className="comic-button" size="lg"><Link href="/admin/reports">Review Reports</Link></Button>
              <Button asChild className="comic-button" size="lg"><Link href="/admin/giveaway">Giveaway Entries</Link></Button>
              <Button asChild className="comic-button" size="lg"><Link href="/admin/listings">Listing Moderation</Link></Button>
              <Button asChild className="comic-button" size="lg"><Link href="/admin/user-search">User Search</Link></Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-2 border-primary bg-card/90 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Admin</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild className="comic-button" size="lg"><Link href="/admin/users">Manage Users</Link></Button>
                <Button asChild className="comic-button" size="lg"><Link href="/admin/orders">Order Moderation</Link></Button>
                <Button asChild className="comic-button" size="lg"><Link href="/admin/seller-approvals">New Seller Approvals</Link></Button>
                <Button asChild className="comic-button" size="lg"><Link href="/admin/spotlight">Manage Spotlight Slots</Link></Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
