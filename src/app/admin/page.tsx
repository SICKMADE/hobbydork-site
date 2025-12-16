"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="space-y-4">
        <Link href="/admin/reports" className="text-blue-600 underline">
          Review Reports
        </Link>
        <Link href="/admin/users" className="text-blue-600 underline">
          Manage Users
        </Link>
        <Link href="/admin/listings" className="text-blue-600 underline">
          Manage Listings
        </Link>
        <Link href="/admin/spotlight" className="text-blue-600 underline">
          Manage Spotlight Slots
        </Link>
      </div>
    </div>
  );
}
