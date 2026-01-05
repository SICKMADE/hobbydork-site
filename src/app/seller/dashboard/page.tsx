"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";

export default function SellerDashboard() {
  const { userData } = useAuth();

  if (!userData?.isSeller) {
    return (
      <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center">
        <div className="max-w-lg w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-8 md:p-12">
          <img src="/apply.png" alt="Become a Seller" className="w-28 h-28 object-contain mb-2 drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold text-red-400 text-center mb-2">Become a Seller</h1>
          <p className="text-lg text-gray-100 text-center mb-4">
            HobbyDork is a safe community marketplace.<br />
            All sellers must follow strict safety rules and use secure Stripe payments.
          </p>
          <Link href="/become-seller" className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-8 py-3 font-bold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 w-full sm:w-auto text-center">
            Start Seller Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
      <AppLayout>
    <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center">
      <div className="max-w-3xl w-full flex flex-col gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-8 md:p-12">
        <div className="flex items-center gap-4 mb-2">
          <img src="/hobbydork-head.png" alt="Seller" className="w-16 h-16 object-contain drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold text-red-400">Seller Dashboard</h1>
        </div>

        {/* Stripe Status */}
        <div className="p-6 rounded-2xl border-2 border-red-500 bg-gray-900/80 shadow flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-white">Stripe Account:</span>
            {userData.stripeAccountId ? (
              <span className="text-green-400 font-bold flex items-center">Connected <span className="ml-1">✔</span></span>
            ) : (
              <span className="text-red-400 font-bold">Not Connected</span>
            )}
          </div>
          <p className="text-sm text-gray-300 mt-1">
            HobbyDork minimizes seller fees and protects buyers & sellers by using secure Stripe transactions.
          </p>
          <Link href="/become-seller" className="mt-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-md px-6 py-2 font-bold rounded-full shadow border-2 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 w-full sm:w-auto text-center">
            Manage Stripe Account
          </Link>
        </div>

        {/* Seller Dashboard Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {userData.storeId && (
            <Link href={`/store/${userData.storeId}`} className="bg-gray-800 rounded-2xl shadow-lg border-2 border-yellow-500 hover:border-yellow-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
              <span className="font-semibold text-lg text-yellow-300 mb-1 group-hover:text-yellow-400">My Store</span>
              <span className="text-sm text-gray-300">View your public store page.</span>
            </Link>
          )}
          <Link href="/seller/orders" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
            <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Orders to Fulfill</span>
            <span className="text-sm text-gray-300">View and manage orders you need to ship.</span>
          </Link>
          <Link href="/sales" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
            <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">My Sales</span>
            <span className="text-sm text-gray-300">See all your completed and active sales.</span>
          </Link>
          <Link href="/seller-analytics" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
            <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Sales Analytics</span>
            <span className="text-sm text-gray-300">Track your store's performance and trends.</span>
          </Link>
          <Link href="/seller/listings" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
            <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Your Listings</span>
            <span className="text-sm text-gray-300">View, edit, and publish your listings.</span>
          </Link>
          <Link href="/seller/payouts" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
            <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Payouts</span>
            <span className="text-sm text-gray-300">View Stripe payout details and history.</span>
          </Link>
          <Link href="/seller/settings" className="bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-700 hover:border-red-400 hover:bg-gray-900 transition-all p-6 flex flex-col items-center cursor-pointer group">
            <span className="font-semibold text-lg text-white mb-1 group-hover:text-red-400">Settings</span>
            <span className="text-sm text-gray-300">Store preferences and seller settings.</span>
          </Link>
        </div>
      </div>
    </div>
      </AppLayout>
  );
}
