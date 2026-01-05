"use client";

import React, { useState } from "react";
import SellerOnboardingStepper from "@/components/onboarding/SellerOnboardingStepper";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";

/* ================= SCHEMA ================= */

const sellerAgreementsSchema = z.object({
  agreeTerms: z.literal(true),
  agreeAge: z.literal(true),
  agreeOneAccount: z.literal(true),
  agreeSellerTerms: z.literal(true),
  agreeShip2Days: z.literal(true),
  sellerIntent: z.string().min(10),
});

type SellerAgreementsFormValues = z.infer<typeof sellerAgreementsSchema>;

/* ================= COMPONENT ================= */

export default function SellerOnboardingTermsPage() {
  const { user, profile, loading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<SellerAgreementsFormValues>({
    resolver: zodResolver(sellerAgreementsSchema),
    mode: "onChange",
    defaultValues: {
      agreeTerms: true,
      agreeAge: true,
      agreeOneAccount: true,
      agreeSellerTerms: true,
      agreeShip2Days: true,
      sellerIntent: "",
    },
  });

  /* ================= SUBMIT ================= */

  async function onSubmit(data: SellerAgreementsFormValues) {
    if (loading || !user) {
      toast({
        title: "Auth not ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ----- Firestore -----
      const appRef = doc(collection(firestore, "sellerApplications"));

      await runTransaction(firestore, async (tx) => {
        tx.set(appRef, {
          applicationId: appRef.id,
          ownerUid: user.uid,
          ownerEmail: user.email,
          ownerDisplayName: profile?.displayName ?? "",
          notes: data.sellerIntent,
          sellerAgreementAccepted: true,
          ageConfirmed: true,
          oneAccountAcknowledged: true,
          agreeShip2Days: true,
          status: "PENDING",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        tx.update(doc(firestore, "users", user.uid), {
          sellerAgreements: data,
          sellerOnboarded: true,
          sellerOnboardedAt: serverTimestamp(),
        });
      });

      // ----- FORCE TOKEN REFRESH -----
      await user.getIdToken(true);

      // ----- CORRECT FUNCTIONS INSTANCE (THIS FIXES AUTH) -----
      const functions = getFunctions(getApp(), "us-central1");
      const onboardStripe = httpsCallable(functions, "createStripeOnboarding");
      const result = await onboardStripe({});
      const { url } = result.data as { url: string };

      window.location.href = url;
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Stripe onboarding failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ================= UI (UNCHANGED) ================= */

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-grid-pattern">
      <SellerOnboardingStepper step={2} />

      <div className="max-w-2xl w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-6 md:p-10">
        <Card className="w-full bg-gray-800 border-2 border-red-500 shadow-xl">
          <div className="flex justify-center pt-4 mb-2">
            <img
              src="/done.png"
              alt="Done"
              className="w-40 h-40 object-contain"
            />
          </div>

          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-red-400 text-center">
              Seller Terms & Agreement
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              <span className="block mb-2">
                Your store name will be:{" "}
                <span className="font-bold text-red-200">
                  {profile?.displayName}
                </span>{" "}
                (cannot be changed)
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormProvider {...methods}>
              <Form {...methods}>
                <form
                  id="seller-terms-form"
                  onSubmit={methods.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {[
                    ["agreeTerms", "I agree to the Terms of Service"],
                    ["agreeAge", "I am at least 18 years old"],
                    ["agreeOneAccount", "Only one account allowed"],
                    ["agreeSellerTerms", "I agree to Seller Terms"],
                    ["agreeShip2Days", "Ship items within 2 days"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={methods.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border p-4 rounded bg-gray-900">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(!!v)}
                            />
                          </FormControl>
                          <FormLabel className="text-gray-100">
                            {label}
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <textarea
                    className="w-full border rounded p-2 bg-gray-900 text-white"
                    placeholder="What do you plan to sell?"
                    {...methods.register("sellerIntent")}
                  />
                </form>
              </Form>
            </FormProvider>
          </CardContent>
        </Card>

        <Button
          type="submit"
          form="seller-terms-form"
          disabled={
            loading ||
            !user ||
            isSubmitting ||
            !methods.formState.isValid
          }
          size="lg"
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {isSubmitting
            ? "Submitting & Redirecting to Stripe…"
            : "Finish & Go to Stripe"}
        </Button>
      </div>
    </div>
  );
}
