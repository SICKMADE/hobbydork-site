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
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client-provider';
import AppLayout from '@/components/layout/AppLayout';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// ✅ PLACEHOLDER STORE AVATAR ONLY
import storeAvatar from '@/components/dashboard/hobbydork-head.png';

/* ---------------- SCHEMA ---------------- */

const storeSchema = z.object({
  about: z.string().min(10, 'About section must be at least 10 characters long.'),
  stripeOnboarded: z.literal(true, {
    errorMap: () => ({
      message: 'You must complete Stripe onboarding to sell on HobbyDork.',
    }),
  }),
});

type SellerFormValues = z.infer<typeof storeSchema>;

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
    <motion.div className="space-y-8">
      <div className="space-y-2">
        <Label>Store Name</Label>
        <Input value={profile.displayName || ''} disabled />
        <FormDescription>
          Store names are permanently tied to your display name.
        </FormDescription>
      </div>

      <div className="space-y-2">
        <Label>Store URL</Label>
        <div className="flex items-center">
          <span className="text-sm bg-muted px-3 py-2 rounded-l-md border border-r-0">
            hobbydork.app/store/
          </span>
          <Input value={slug} disabled className="rounded-l-none" />
        </div>
      </div>

      <FormField
        control={control}
        name="about"
        render={({ field }) => (
          <FormItem>
            <FormLabel>About Your Store</FormLabel>
            <Textarea {...field} rows={3} />
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
      if (res?.data?.url) window.location.href = res.data.url;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Stripe Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-6">
      <FormDescription>
        All payments on HobbyDork are processed securely through Stripe.
      </FormDescription>

      <Button
        type="button"
        onClick={startStripeOnboarding}
        disabled={loading}
        className="w-full bg-purple-600"
      >
        {loading ? 'Connecting…' : 'Connect Stripe'}
      </Button>

      <FormField
        control={control}
        name="stripeOnboarded"
        render={({ field }) => (
          <FormItem className="flex gap-3 border p-4 rounded">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            <FormLabel>I have completed Stripe onboarding</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};

/* ---------------- MAIN ---------------- */

export default function ClientStoreSetup() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const methods = useForm<SellerFormValues>({
    resolver: zodResolver(storeSchema),
    mode: 'onChange',
    defaultValues: { about: '', stripeOnboarded: true },
  });

  useEffect(() => {
    if (profile?.isSeller && profile.storeId) {
      router.replace(`/store/${profile.storeId}`);
    }
  }, [profile, router]);

  async function onSubmit(values: SellerFormValues) {
    if (!user || !firestore || !profile?.displayName) return;

    setSaving(true);

    try {
      const slug = profile.displayName.toLowerCase().replace(/\s+/g, '-');
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
          ownerUid: user.uid,
          storeName: profile.displayName,
          slug,
          about: values.about,
          avatarUrl: storeAvatar.src, // ✅ placeholder ONLY
          status: 'ACTIVE',
          createdAt: serverTimestamp(),
        });
      });

      toast({ title: 'Store created' });
      router.push(`/store/${storeRef.id}`);
    } catch (e) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({ path: 'store/setup', operation: 'write' })
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{step === 1 ? 'Create Store' : 'Connect Stripe'}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <AnimatePresence>
                {step === 1 && <Step1Store />}
                {step === 2 && <Step2Stripe />}
              </AnimatePresence>

              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                )}
                {step < 2 ? (
                  <Button onClick={() => setStep(2)}>Next</Button>
                ) : (
                  <Button type="submit" disabled={saving}>
                    Create Store
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
