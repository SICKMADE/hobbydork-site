"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function OnboardingSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function finish() {
      if (!user) return;
      try {
        const fn = httpsCallable(getFunctions(undefined, "us-central1"), "checkStripeSellerStatus");
        const res: any = await fn({});
        if (res?.data?.isSeller) {
          toast({ title: "Stripe connected", description: "You can finish setting up your store." });
        } else {
          toast({
            variant: "destructive",
            title: "Stripe not connected",
            description: res?.data?.reason || "We couldn't verify your Stripe account. Please try connecting again.",
          });
        }
        router.push("/store/create");
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err?.message || "Unexpected error" });
        router.push("/store/create");
      } finally {
        setLoading(false);
      }
    }
    finish();
  }, [user, router, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <Card>
          <CardHeader>
            <CardTitle>Finishing Stripe setup...</CardTitle>
            <CardDescription>We'll redirect you to finish creating your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6 text-center">
              <p className="mb-4">Hang tight while we confirm your Stripe account.</p>
              <Button onClick={() => router.push('/store/create')}>
                Continue to Create Store
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
