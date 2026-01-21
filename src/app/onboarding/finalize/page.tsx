"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function FinalizeSellerPage() {
  const { user } = useAuth();
  // --- Loading, error, and toast state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Production: Admin notification and analytics logging
  const notifyAdmin = async () => {
    // Example: Send notification to Firestore collection
    try {
      const functions = getFunctions(getApp(), "us-central1");
      const adminNotify = httpsCallable(functions, "adminNotify");
      await adminNotify({ type: "seller_onboarding_complete", user: user?.uid });
    } catch (err) {
      // Optionally log error or surface to monitoring
    }
  };
  const logAnalytics = (event: string) => {
    // Example: Use Google Analytics or other service
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", event, { user_id: user?.uid });
    }
    // Integrate with other analytics providers as needed
  };

  useEffect(() => {
    // Hide spinner after short delay for better UX
    const t = setTimeout(() => setShowSpinner(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleFinalize = async () => {
    setLoading(true);
    setError(null);
    setShowSupport(false);
    try {
      const functions = getFunctions(getApp(), "us-central1");
      const finalizeSeller = httpsCallable(functions, "finalizeSeller");
      await finalizeSeller({});
      // Success feedback
      toast({ title: "Seller account created!", description: "You now have full seller access.", variant: "default" });
      notifyAdmin();
      logAnalytics("seller_onboarding_complete");
      router.replace("/onboarding/success");
    } catch (err: any) {
      let msg = err?.message || "Failed to finalize seller onboarding.";
      if (msg.includes("Stripe onboarding incomplete")) {
        msg = "Stripe onboarding is not complete. Please finish all required steps on Stripe and try again.";
        setShowSupport(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Responsive, accessible, and commented UI ---
  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.svg')] bg-cover bg-center">
      {/* Loading spinner for initial load */}
      {showSpinner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-500 border-b-4 border-white"></div>
        </div>
      )}
      <div className="max-w-lg w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-6 md:p-10 sm:p-4">
        <Image
          src="/landing.png"
          alt="Finalize"
          width={128}
          height={128}
          className="w-32 h-32 object-contain mb-4 drop-shadow-lg"
          priority
        />
        <h1 className="text-3xl font-extrabold text-red-400 text-center mb-2">Almost Done!</h1>
        <p className="text-lg text-gray-100 text-center mb-4">
          You’ve completed Stripe onboarding.<br />
          Click below to finalize your seller account and unlock all features.
        </p>
        {error && (
          <div className="text-red-400 text-center mb-2">
            {error}
            {showSupport && (
              <div className="mt-2">
                <Link href="/help" className="underline text-red-300 hover:text-red-200">Contact Support</Link>
              </div>
            )}
          </div>
        )}
        <Button
          onClick={handleFinalize}
          disabled={loading}
          size="lg"
          aria-label="Create Store"
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xl px-10 py-5 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 select-none focus:outline-none focus:ring-2 focus:ring-red-400 w-full sm:w-auto transition-all duration-100"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
              Finalizing…
            </span>
          ) : (
            <span className="drop-shadow-lg">Create Store</span>
          )}
        </Button>
      </div>
    </div>
  );
}