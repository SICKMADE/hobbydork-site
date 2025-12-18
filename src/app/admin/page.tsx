"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const role = profile?.role;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // AdminLayout should already block, but keep this safe.
  if (!isAdmin && !isModerator) {
    return <div className="p-6">You do not have access.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="space-y-4">
        <Link href="/admin/moderation" className="text-blue-600 underline">
          Moderation Queue
        </Link>
        <Link href="/admin/reports" className="text-blue-600 underline">
          Review Reports
        </Link>
        <Link href="/admin/listings" className="text-blue-600 underline">
          Listing Moderation
        </Link>
        <Link href="/admin/user-search" className="text-blue-600 underline">
          User Search
        </Link>

        {isAdmin && (
          <>
            <Link href="/admin/users" className="text-blue-600 underline">
              Manage Users
            </Link>
            <Link href="/admin/orders" className="text-blue-600 underline">
              Order Moderation
            </Link>
            <Link href="/admin/seller-applications" className="text-blue-600 underline">
              Seller Applications
            </Link>
            <Link href="/admin/spotlight" className="text-blue-600 underline">
              Manage Spotlight Slots
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
