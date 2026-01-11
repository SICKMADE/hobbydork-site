
"use client";

import React, { useState, useMemo } from "react";
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
import { doc, runTransaction, serverTimestamp, collection } from "firebase/firestore";
import { useEffect } from "react";
import { getFirebase } from "@/firebase/client-init";
import { httpsCallable } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";

const sellerAgreementsSchema = z.object({
  agreeTerms: z.boolean().refine((v) => v === true, {
    message: "You must agree to the Terms of Service.",
  }),
  agreeAge: z.boolean().refine((v) => v === true, {
    message: "You must confirm you are 18 or older.",
  }),
  agreeOneAccount: z.boolean().refine((v) => v === true, {
    message: "Only one account is allowed.",
  }),
  agreeSellerTerms: z.boolean().refine((v) => v === true, {
    message: "You must accept the Seller Terms.",
  }),
  agreeShip2Days: z.boolean().refine((v) => v === true, {
    message: "You must agree to ship any sold item within 2 days of sale.",
  }),
  sellerIntent: z.string().min(10, 'Please describe what you plan to sell (at least 10 characters).'),
});

type SellerAgreementsFormValues = z.infer<typeof sellerAgreementsSchema>;

export default function BecomeSellerTermsPage() {
  const { user, profile } = useAuth();
  // Generate storeId from displayName (slugify)
  const storeId = useMemo(() => {
    if (!profile?.displayName) return "";
    return profile.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [profile?.displayName]);
  const firestore = useFirestore();
  const methods = useForm<SellerAgreementsFormValues>({
    resolver: zodResolver(sellerAgreementsSchema),
    mode: "onChange",
    defaultValues: {
      agreeTerms: false,
      agreeAge: false,
      agreeOneAccount: false,
      agreeSellerTerms: false,
      agreeShip2Days: false,
      sellerIntent: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


  const [functions, setFunctions] = useState<any>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setFunctions(getFirebase().functions);
    }
  }, []);

  async function onSubmit(data: SellerAgreementsFormValues) {
    setIsSubmitting(true);
    try {
      if (!user) {
        toast({ title: "User not found", description: "You must be logged in to complete onboarding.", variant: "destructive" });
        return;
      }
      if (!storeId) {
        toast({ title: "Store name missing", description: "Display name is required to generate a store ID.", variant: "destructive" });
        return;
      }
      const appRef = doc(collection(firestore, 'sellerApplications'));
      await runTransaction(firestore, async (transaction) => {
        transaction.set(appRef, {
          applicationId: appRef.id,
          ownerUid: user.uid,
          ownerEmail: user.email,
          ownerDisplayName: profile?.displayName ?? "",
          notes: data.sellerIntent,
          sellerAgreementAccepted: data.agreeSellerTerms,
          ageConfirmed: data.agreeAge,
          oneAccountAcknowledged: data.agreeOneAccount,
          agreeShip2Days: data.agreeShip2Days,
          status: 'PENDING',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Only update allowed fields in user doc (not role, isSeller, sellerStatus)
        const userRef = doc(firestore, "users", user.uid);
        transaction.update(userRef, {
          storeId,
          sellerAgreements: data,
          sellerOnboarded: true,
          sellerOnboardedAt: serverTimestamp(),
        });
      });
      if (!functions) {
        throw new Error("Cloud Functions are not available. Please try again in the browser.");
      }
      const onboardStripe = httpsCallable(functions, "createStripeOnboarding");
      const result = await onboardStripe({ uid: user.uid, redirectUrl: window.location.origin + "/onboarding/success" });
      const dataWithUrl = result.data as { url?: string };
      if (dataWithUrl?.url) {
        window.location.href = dataWithUrl.url;
      } else {
        throw new Error("Stripe onboarding failed to start.");
      }
    } catch (err) {
      toast({ title: "Error completing onboarding", description: String(err), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-grid-pattern"
    >
      <SellerOnboardingStepper step={2} />
      <div className="max-w-2xl w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-6 md:p-10">
        <Card className="w-full bg-gray-800 border-2 border-red-500 shadow-xl">
          <div className="flex justify-center pt-4 mb-2">
            <img src="/done.png" alt="Done" className="w-40 h-40 object-contain" />
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-red-400 text-center">Seller Terms & Agreement</CardTitle>
            <CardDescription className="text-center text-gray-300">
              <span className="block mb-2">Your store name will be: <span className="font-bold text-red-200">{profile?.displayName ?? ""}</span> (cannot be changed)</span>
              <span className="block mb-2 text-xs text-gray-400">Store ID: <span className="font-mono text-red-300">{storeId}</span></span>
              <span className="text-sm">Please read and agree to all terms below to continue.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <Form {...methods}>
                <form id="seller-terms-form" onSubmit={methods.handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <FormField
                      control={methods.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border p-4 rounded bg-gray-900">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                          </FormControl>
                          <FormLabel className="leading-snug text-gray-100">
                            I agree to the <a href="/terms" className="underline text-red-400">Terms of Service</a> and <a href="/privacy" className="underline text-red-400">Privacy Policy</a>.
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="agreeAge"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border p-4 rounded bg-gray-900">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                          </FormControl>
                          <FormLabel className="leading-snug text-gray-100">
                            I confirm I am at least 18 years old.
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="agreeOneAccount"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border p-4 rounded bg-gray-900">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                          </FormControl>
                          <FormLabel className="leading-snug text-gray-100">
                            I understand only one account is allowed per person.
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="agreeSellerTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border p-4 rounded bg-gray-900">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                          </FormControl>
                          <FormLabel className="leading-snug text-gray-100">
                            I have read and agree to the <a href="/seller-terms" className="underline text-red-400">Seller Terms</a> (no offsite sales, no prohibited items, etc.).
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="agreeShip2Days"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 border p-4 rounded bg-gray-900">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                          </FormControl>
                          <FormLabel className="leading-snug text-gray-100">
                            I agree to ship any sold item within <span className="font-bold">2 days</span> of sale.
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-6">
                    <label className="block font-semibold mb-1 text-gray-200">What do you plan to sell? <span className="text-red-400">*</span></label>
                    <textarea
                      className="w-full border rounded p-2 min-h-[60px] bg-gray-900 text-gray-100 placeholder-gray-400"
                      {...methods.register('sellerIntent')}
                      placeholder="Describe your products, niche, or what makes your shop unique..."
                      required
                    />
                    {methods.formState.errors.sellerIntent && (
                      <p className="text-red-400 text-xs mt-1">{methods.formState.errors.sellerIntent.message as string}</p>
                    )}
                  </div>
                </form>
              </Form>
            </FormProvider>
          </CardContent>
        </Card>
        <div className="w-full flex justify-center mt-2">
          <Button
            type="submit"
            form="seller-terms-form"
            disabled={isSubmitting || !methods.formState.isValid}
            size="lg"
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 custom-btn-shadow custom-letter custom-textshadow"
          >
            {isSubmitting ? "Submitting & Redirecting to Stripe…" : "Finish & Go to Stripe"}
          </Button>
        </div>
      </div>
    </div>
  );
}
