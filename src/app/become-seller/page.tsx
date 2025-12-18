"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { getFunctions, httpsCallable } from "firebase/functions";

import { Button } from "@/components/ui/button";

export default function BecomeSellerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function startStripeOnboarding() {
    if (!user) return;

    setLoading(true);

    try {
      const fn = httpsCallable(
        getFunctions(),
        "onboardStripe"
      );

      const res: any = await fn({});

      if (!res?.data?.url) {
        throw new Error("Stripe onboarding URL missing");
      }

      // Redirect user to Stripe onboarding
      window.location.href = res.data.url;
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Stripe error",
        description:
          err?.message ?? "Could not start Stripe onboarding",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Become a Seller</h1>

      <p className="text-muted-foreground">
        To sell on HobbyDork, you must complete Stripe onboarding.
        This allows you to accept payments securely.
      </p>

      <Button
        onClick={startStripeOnboarding}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Redirecting to Stripe…" : "Connect Stripe & Become Seller"}
      </Button>
    </div>
  );
}
