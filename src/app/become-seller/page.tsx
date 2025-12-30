"use client";


import React, { useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, runTransaction, serverTimestamp, collection } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";
import storeAvatar from "@/components/dashboard/hobbydork-head.png";

type SellerAgreementsFormValues = z.infer<typeof sellerAgreementsSchema>;


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
});

  import { CheckCircleIcon } from '@/components/ui/CheckCircleIcon';

const SellerAgreementsStep = () => {
  const { control } = useFormContext<SellerAgreementsFormValues>();
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="agreeTerms"
        render={({ field }) => (
          <FormItem className="flex items-start space-x-3 border p-4 rounded">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
            </FormControl>
            <FormLabel className="leading-snug">
              I agree to the <a href="/terms" className="underline text-primary">Terms of Service</a> and <a href="/privacy" className="underline text-primary">Privacy Policy</a>.
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="agreeAge"
        render={({ field }) => (
          <FormItem className="flex items-start space-x-3 border p-4 rounded">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
            </FormControl>
            <FormLabel className="leading-snug">
              I confirm I am at least 18 years old.
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="agreeOneAccount"
        render={({ field }) => (
          <FormItem className="flex items-start space-x-3 border p-4 rounded">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
            </FormControl>
            <FormLabel className="leading-snug">
              I understand only one account is allowed per person.
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="agreeSellerTerms"
        render={({ field }) => (
          <FormItem className="flex items-start space-x-3 border p-4 rounded">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
            </FormControl>
            <FormLabel className="leading-snug">
              I have read and agree to the <a href="/seller-terms" className="underline text-primary">Seller Terms</a> (no offsite sales, no prohibited items, etc.).
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Need help? <a href="mailto:support@hobbydork.com" className="underline text-primary">Contact Support</a>
      </div>
    </div>
  );
};

export default function BecomeSellerPage() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const SellerAgreementsStep = ({ step }: { step: number }) => {
    const { control } = useFormContext<SellerAgreementsFormValues>();
    const steps = [
      'Agree to Terms & Privacy',
      'Confirm Age',
      'One Account Policy',
      'Accept Seller Terms',
      'Connect Stripe',
      'Finish & Create Store',
    ];
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Progress value={((step + 1) / steps.length) * 100} />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {steps.map((label, i) => (
              <span key={label} className={i <= step ? 'font-bold text-primary' : ''}>{label}</span>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <FormField
            control={control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 border p-4 rounded bg-white shadow">
                <CheckCircleIcon className={field.value ? 'h-6 w-6 text-green-500' : 'h-6 w-6 text-gray-300'} />
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                </FormControl>
                <FormLabel className="leading-snug">
                  I agree to the <a href="/terms" className="underline text-primary">Terms of Service</a> and <a href="/privacy" className="underline text-primary">Privacy Policy</a>.
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="agreeAge"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 border p-4 rounded bg-white shadow">
                <CheckCircleIcon className={field.value ? 'h-6 w-6 text-green-500' : 'h-6 w-6 text-gray-300'} />
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                </FormControl>
                <FormLabel className="leading-snug">
                  I confirm I am at least 18 years old.
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="agreeOneAccount"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 border p-4 rounded bg-white shadow">
                <CheckCircleIcon className={field.value ? 'h-6 w-6 text-green-500' : 'h-6 w-6 text-gray-300'} />
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                </FormControl>
                <FormLabel className="leading-snug">
                  I understand only one account is allowed per person.
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="agreeSellerTerms"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 border p-4 rounded bg-white shadow">
                <CheckCircleIcon className={field.value ? 'h-6 w-6 text-green-500' : 'h-6 w-6 text-gray-300'} />
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                </FormControl>
                <FormLabel className="leading-snug">
                  I have read and agree to the <a href="/seller-terms" className="underline text-primary">Seller Terms</a> (no offsite sales, no prohibited items, etc.).
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Need help? <a href="mailto:support@hobbydork.com" className="underline text-primary">Contact Support</a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100 p-4">
      <div className="max-w-xl w-full">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 relative">
            <img src="/hobbydork-head.png" alt="HobbyDork" className="object-contain w-full h-full" />
          </div>
        </div>
        <Card className="shadow-xl border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-900">Become a Seller</CardTitle>
            <CardDescription>
              <span className="block mb-2">Your store name will be: <span className="font-bold text-blue-700">{profile.displayName}</span> (cannot be changed)</span>
              <span className="text-sm text-muted-foreground">Follow the steps below to unlock seller features.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <Form {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                  <SellerAgreementsStep step={0} />
                  <div className="mt-8 flex flex-col gap-4">
                    <Button
                      type="button"
                      onClick={handleStripeOnboarding}
                      disabled={stripeLoading || stripeConnected}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {stripeConnected ? "Stripe Connected" : stripeLoading ? "Connecting…" : "Connect Stripe"}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !methods.formState.isValid || !stripeConnected}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {isSubmitting ? "Creating Store…" : "Finish & Create Store"}
                    </Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ...replaced with new professional onboarding flow above...
