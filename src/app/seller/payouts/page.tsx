"use client";

import { useAuth } from "@/hooks/use-auth";

export default function SellerPayouts() {
  const { userData } = useAuth();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <p className="text-gray-700">
        HobbyDork uses secure Stripe payouts.  
        All earnings are transferred directly to your Stripe account.
      </p>

      <p>Stripe Account ID:</p>
      <p className="font-mono">{userData?.stripeAccountId || "Not connected"}</p>

      <p className="mt-2 text-sm text-gray-600">
        Visit your Stripe Dashboard for full payout details.
      </p>

      <a
        href="https://dashboard.stripe.com/"
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener"
      >
        Open Stripe Dashboard
      </a>
    </div>
  );
}
