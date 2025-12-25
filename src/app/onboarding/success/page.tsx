"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";


export default function OnboardingSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const checkStatus = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setStripeStatus(null);
    try {
      const fn = httpsCallable(getFunctions(undefined, "us-central1"), "checkStripeSellerStatus");
      const res: any = await fn({});
      if (res?.data?.isSeller) {
        // Update Firestore: set stripeOnboarded and stripeTermsAgreed to true
        const firestore = getFirestore();
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, {
          stripeOnboarded: true,
          stripeTermsAgreed: true,
          updatedAt: serverTimestamp(),
        });
        setIsSeller(true);
        setStripeStatus("Stripe connected. You can finish setting up your store.");
        setTimeout(() => {
          router.push("/store/create");
        }, 1200);
      } else {
        setIsSeller(false);
        setStripeStatus(res?.data?.reason || "We couldn't verify your Stripe account. Please try connecting again.");
        setError(res?.data?.reason || "Stripe not connected.");
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
      setStripeStatus(null);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <Card>
          <CardHeader>
            <CardTitle>Finishing Stripe setup...</CardTitle>
            <CardDescription>
              {loading ? "Checking your Stripe account..." : isSeller ? "Stripe connected!" : "Stripe not connected."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6 text-center">
              {loading && <p className="mb-4">Hang tight while we confirm your Stripe account.</p>}
              {!loading && stripeStatus && <p className="mb-4">{stripeStatus}</p>}
              {error && (
                <>
                  <p className="mb-4 text-red-600">{error}</p>
                  <Button onClick={() => { setRetrying(true); checkStatus(); }} disabled={retrying || loading}>
                    {retrying ? "Checking..." : "Check Stripe Status Again"}
                  </Button>
                </>
              )}
              {isSeller && !loading && (
                <Button onClick={() => router.push('/store/create')}>
                  Continue to Create Store
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
