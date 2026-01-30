"use client";

import React from "react";
import SellerOnboardingStepper from "@/components/onboarding/SellerOnboardingStepper";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SellerTiersInfoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-grid-pattern">
      <SellerOnboardingStepper step={1} />
      <div className="max-w-2xl w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-yellow-500 bg-background/90 backdrop-blur-md p-6 md:p-10">
        <h1 className="text-3xl font-extrabold text-yellow-400 text-center mb-4">Seller Tiers & Auction Rules</h1>
        <div className="text-gray-200 text-lg space-y-4">
          <div>
            <span className="font-bold text-yellow-300">Bronze Seller:</span> All new sellers start as Bronze. Bronze sellers can create buy-now listings only. Auction creation is not available. Buy-now listing fee: <span className="font-bold">10%</span> of sale price.
          </div>
          <div>
            <span className="font-bold text-gray-300">Silver Seller:</span> Earned by maintaining good performance. Silver sellers can create both buy-now listings and auctions. Auction creation requires an upfront fee: <span className="font-bold">5%</span> of starting price (minimum $10), no backend/final value fee. Buy-now listing fee: <span className="font-bold">7%</span> of sale price.
          </div>
          <div>
            <span className="font-bold text-yellow-200">Gold Seller:</span> Top tier for trusted sellers. Gold sellers can create both buy-now listings and auctions. Auction creation requires an upfront fee: <span className="font-bold">2%</span> of starting price (minimum $5), no backend/final value fee. Buy-now listing fee: <span className="font-bold">5%</span> of sale price.
          </div>
          <div>
            <span className="font-bold text-red-300">Auction Rules:</span> Only Silver and Gold sellers can create auctions. Auction fees are charged upfront based on your tier. No additional fees are charged when the auction ends. All sales (auction and buy-now) appear in your dashboard and notifications.
          </div>
          <div>
            <span className="font-bold text-blue-300">Tier Upgrades:</span> Seller tier is upgraded automatically based on your performance (on-time shipping, completed orders, low disputes, etc.).
          </div>
        </div>
        <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-yellow-400 mt-6">
          <Link href="/onboarding/terms">I Understand, Continue</Link>
        </Button>
      </div>
    </div>
  );
}
