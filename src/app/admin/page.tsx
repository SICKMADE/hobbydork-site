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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Moderation and site management tools.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Moderation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline"><Link href="/admin/moderation">Moderation Queue</Link></Button>
              <Button asChild variant="outline"><Link href="/admin/reports">Review Reports</Link></Button>
              <Button asChild variant="outline"><Link href="/admin/giveaway">Giveaway Entries</Link></Button>
              <Button asChild variant="outline"><Link href="/admin/listings">Listing Moderation</Link></Button>
              <Button asChild variant="outline"><Link href="/admin/user-search">User Search</Link></Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button asChild variant="outline"><Link href="/admin/users">Manage Users</Link></Button>
                <Button asChild variant="outline"><Link href="/admin/orders">Order Moderation</Link></Button>
                <Button asChild variant="outline"><Link href="/admin/seller-approvals">New Seller Approvals</Link></Button>
                <Button asChild variant="outline"><Link href="/admin/spotlight">Manage Spotlight Slots</Link></Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
