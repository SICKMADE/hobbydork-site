'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import { useFirestore } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';

import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client-provider';

import AppLayout from '@/components/layout/AppLayout';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// ✅ FIXED AVATAR
import storeAvatar from '@/components/dashboard/hobbydork-head.png';

/* ---------------- SCHEMA ---------------- */

const sellerSchema = z.object({
  about: z.string().min(10, 'About section must be at least 10 characters long.'),
  stripeOnboarded: z.literal(true, {
    errorMap: () => ({
      message: 'You must complete Stripe onboarding to sell.',
    }),
  }),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

/* ---------------- STEP 1 ---------------- */

const Step1Store = () => {
  const { control } = useFormContext<SellerFormValues>();
  const { profile } = useAuth();

  if (!profile) return null;

  const slug =
    profile.displayName
      ?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <Label>Store Name</Label>
        <Input value={profile.displayName || ''} disabled readOnly />
        <FormDescription>
          Your store name is permanently linked to your display name.
        </FormDescription>
      </div>

      <div className="space-y-2">
        <Label>Store URL</Label>
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 h-10 flex items-center">
            hobbydork.app/store/
          </span>
          <Input value={slug} disabled readOnly className="rounded-l-none" />
        </div>
        <FormDescription>
          This URL is permanent and cannot be changed.
        </FormDescription>
      </div>

      <FormField
        control={control}
        name="about"
        render={({ field }) => (
          <FormItem>
            <FormLabel>About Your Store</FormLabel>
            <Textarea
              placeholder="Tell buyers what makes your store great..."
              {...field}
              rows={3}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};

/* ---------------- STEP 2 ---------------- */

const Step2Stripe = () => {
  const { control } = useFormContext<SellerFormValues>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const startStripeOnboarding = async () => {
    setLoading(true);
    try {
      const onboard = httpsCallable(functions, 'onboardStripe');
      const res: any = await onboard({});
      if (res.data?.url) window.location.href = res.data.url;
      else throw new Error('Stripe onboarding failed.');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Stripe Error', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="font-semibold">Stripe Payments</p>
          <p className="text-sm text-muted-foreground">
            All payments on HobbyDork are processed securely through Stripe.
          </p>

          <Button
            type="button"
            onClick={startStripeOnboarding}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Connecting…' : 'Connect Stripe'}
          </Button>
        </CardContent>
      </Card>

      <FormField
        control={control}
        name="stripeOnboarded"
        render={({ field }) => (
          <FormItem className="flex gap-3 items-start border p-4 rounded">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            <div>
              <FormLabel>Stripe onboarding completed</FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </motion.div>
  );
};

/* ---------------- PAGE ---------------- */

export default function CreateStorePage() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const methods = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    mode: 'onChange',
    defaultValues: {
      about: '',
      stripeOnboarded: true,
    },
  });

  async function onSubmit(values: SellerFormValues) {
    if (!user || !firestore || !profile?.displayName) return;

    setSaving(true);

    try {
      const slug = profile.displayName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const storeRef = doc(collection(firestore, 'storefronts'));
      const userRef = doc(firestore, 'users', user.uid);

      await runTransaction(firestore, async (tx) => {
        tx.update(userRef, {
          isSeller: true,
          storeId: storeRef.id,
          stripeOnboarded: true,
          updatedAt: serverTimestamp(),
        });

        tx.set(storeRef, {
          id: storeRef.id,
          storeId: storeRef.id,
          ownerUid: user.uid,
          storeName: profile.displayName,
          slug,
          about: values.about,
          avatarUrl: storeAvatar.src,
          ratingAverage: 0,
          ratingCount: 0,
          itemsSold: 0,
          status: 'ACTIVE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      toast({ title: 'Store created' });
      router.push(`/store/${storeRef.id}`);
    } catch (e) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: 'store/create',
          operation: 'write',
        })
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{step === 1 ? 'Create Store' : 'Connect Stripe'}</CardTitle>
            <CardDescription>Step {step} of 2</CardDescription>
          </CardHeader>

          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1Store key="s1" />}
                  {step === 2 && <Step2Stripe key="s2" />}
                </AnimatePresence>

                <div className="flex justify-between mt-6">
                  {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 2 ? (
                    <Button onClick={() => setStep(2)}>Next</Button>
                  ) : (
                    <Button type="submit" disabled={saving || !methods.formState.isValid}>
                      {saving ? 'Saving…' : 'Create Store'}
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
