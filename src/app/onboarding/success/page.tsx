"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingSuccessPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function finish() {
      if (!user || !firestore) return;

      try {
        const userRef = doc(firestore, "users", user.uid);
        const snap = await getDoc(userRef);

        // If stripeAccountId exists, mark onboarding complete
        const data = snap.exists() ? snap.data() : null;
        if (data?.stripeAccountId) {
          await updateDoc(userRef, {
            stripeOnboarded: true,
            updatedAt: serverTimestamp(),
          });

          toast({ title: "Stripe connected", description: "You can finish setting up your store." });
          router.push("/store/create");
          return;
        }

        // If no account id found, inform the user
        toast({ variant: "destructive", title: "Stripe not connected", description: "We couldn't find your Stripe account. Please try connecting again." });
        router.push("/store/create");
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err?.message || "Unexpected error" });
      } finally {
        setLoading(false);
      }
    }

    finish();
  }, [user, firestore, router, toast]);

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
