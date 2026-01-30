"use client";
import dynamic from "next/dynamic";

// Dynamically import the ShippingAddressForm to avoid SSR issues
const ShippingAddressForm = dynamic(() => import("../../seller/settings/ShippingAddressForm"), { ssr: false });

export default function ShippingAddressStep() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-grid-pattern">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-6 md:p-10">
        <h1 className="text-3xl font-extrabold text-red-400 text-center mb-2">Where will your packages ship from?</h1>
        <p className="text-lg text-gray-100 text-center mb-4">
          Enter the address you will use as your shipping origin. Buyers will see estimated delivery based on this location. This is required to complete onboarding.<br/>
          <span className="text-xs text-gray-400 block mt-2">(This is separate from your Stripe payout address.)</span>
        </p>
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-md">
            <ShippingAddressForm />
          </div>
        </div>
      </div>
    </div>
  );
}
