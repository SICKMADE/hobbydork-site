
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
// Placeholder for toast (success feedback)
import { useToast } from "@/hooks/use-toast";

export default function OnboardingSuccess() {
  // --- Auth, router, and toast hooks ---
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showSpinner, setShowSpinner] = useState(true);
  // --- Only show toast once ---
  const [toastShown, setToastShown] = useState(false);

  // Placeholder for admin notification and analytics logging
  const notifyAdmin = () => {
    // TODO: Implement real admin notification (email, dashboard, etc.)
    // Example: send to webhook or Firestore collection
    // fetch('/api/admin-notify', { method: 'POST', body: ... })
  };
  const logAnalytics = (event: string) => {
    // TODO: Implement real analytics logging
    // Example: window.gtag('event', event, ...)
  };

  useEffect(() => {
    // If user is not a seller, redirect to finalize step
    if (user && !profile?.isSeller) {
      router.replace("/onboarding/finalize");
    }
    // Hide spinner after short delay for better UX
    const t = setTimeout(() => setShowSpinner(false), 600);
    return () => clearTimeout(t);
  }, [user, profile, router]);

  useEffect(() => {
    // Show success toast and log analytics/admin only once
    if (profile?.isSeller && !toastShown) {
      toast({ title: "Welcome, Seller!", description: "Your seller account is now active.", variant: "default" });
      notifyAdmin();
      logAnalytics("seller_onboarding_success_page");
      setToastShown(true);
    }
  }, [profile, toast, toastShown]);

  // --- Responsive, accessible, and commented UI ---
  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center">
      {/* Loading spinner for initial load */}
      {showSpinner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-500 border-b-4 border-white"></div>
        </div>
      )}
      <div className="max-w-lg w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-6 md:p-10 sm:p-4">
        <img
          src="/landing.png"
          alt="Welcome"
          className="w-32 h-32 object-contain mb-4 drop-shadow-lg"
        />
        <h1 className="text-4xl font-extrabold text-red-400 text-center mb-2">
          Onboarding Complete!
        </h1>
        <p className="text-lg text-gray-100 text-center mb-4">
          Your seller onboarding is finished.<br />
          You now have access to all seller features.<br />
          Welcome to the Hobbydork marketplace!
        </p>
            <Link
              href="/seller/dashboard"
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-8 py-3 font-bold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 w-full sm:w-auto"
              aria-label="Go to Seller Dashboard"
            >
              Go to Seller Dashboard
            </Link>
      </div>
    </div>
  );
}
