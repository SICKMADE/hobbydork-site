"use client";

import AppLayout from "@/components/layout/AppLayout";

export default function SellerSettings() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Seller Settings</h1>
        <p className="text-gray-700">
          HobbyDork is committed to safety, transparency, and minimal seller fees.
        </p>
        <p className="text-gray-600 text-sm">
          Additional seller customization options will be added here.
        </p>
      </div>
    </AppLayout>
  );
}
