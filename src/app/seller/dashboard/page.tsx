"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function SellerDashboard() {
  const { userData } = useAuth();

  if (!userData?.isSeller) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Become a Seller</h1>
        <p className="mt-2 text-gray-700">
          HobbyDork is a safe community marketplace.  
          All sellers must follow strict safety rules and use secure Stripe payments.
        </p>
        <Link href="/become-seller">
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            Start Seller Onboarding
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Seller Dashboard</h1>

      {/* Stripe Status */}
      <div className="p-4 border rounded bg-white shadow">
        <p className="font-semibold text-lg">Stripe Account</p>

        {userData.stripeAccountId ? (
          <p className="text-green-600">Connected ✔</p>
        ) : (
          <p className="text-red-600">Not Connected</p>
        )}

        <p className="text-sm mt-2">
          HobbyDork minimizes seller fees and protects buyers & sellers by using secure Stripe transactions.
        </p>

        <Link href="/become-seller">
          <button className="mt-3 bg-blue-600 text-white px-3 py-1 rounded">
            Manage Stripe Account
          </button>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/seller/orders">
          <div className="p-4 bg-gray-100 rounded shadow hover:bg-gray-200 cursor-pointer">
            <p className="font-semibold">Orders</p>
            <p className="text-sm text-gray-600">Manage your sales</p>
          </div>
        </Link>

        <Link href="/seller/listings">
          <div className="p-4 bg-gray-100 rounded shadow hover:bg-gray-200 cursor-pointer">
            <p className="font-semibold">Your Listings</p>
            <p className="text-sm text-gray-600">View & edit listings</p>
          </div>
        </Link>

        <Link href="/seller/payouts">
          <div className="p-4 bg-gray-100 rounded shadow hover:bg-gray-200 cursor-pointer">
            <p className="font-semibold">Payouts</p>
            <p className="text-sm text-gray-600">Stripe payout details</p>
          </div>
        </Link>

        <Link href="/seller/settings">
          <div className="p-4 bg-gray-100 rounded shadow hover:bg-gray-200 cursor-pointer">
            <p className="font-semibold">Settings</p>
            <p className="text-sm text-gray-600">Store preferences</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
