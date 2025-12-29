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
import { doc, runTransaction, serverTimestamp, collection, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/client-provider';

import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

import AppLayout from '@/components/layout/AppLayout';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// ✅ FIXED AVATAR
import storeAvatar from '@/components/dashboard/hobbydork-head.png';

/* ---------------- SCHEMA ---------------- */

const sellerSchema = z.object({
  about: z.string().min(10, 'About section must be at least 10 characters long.'),
  stripeOnboarded: z.boolean().refine((v) => v === true, {
    message: 'You must complete Stripe onboarding to sell.',
  }),
  agreeSellerTerms: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Seller Terms.',
  }),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

/* ---------------- STEP 1 ---------------- */

const Step1Store = () => {
  const { control } = useFormContext<SellerFormValues>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

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
            hobbydork.com/store/
          </span>
          <Input value={'<store-id>'} disabled readOnly className="rounded-l-none" />
        </div>
        <FormDescription>
          Your shareable store URL will be created when you finish setup.
        </FormDescription>
      </div>

      <div className="space-y-2">
        <Label>Store Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            // Stash it on window so the parent submit can pick it up without changing the form schema.
            (window as any).__pendingStoreImageFile = f;
            if (f) toast({ title: 'Store image selected' });
          }}
        />
        <FormDescription>
          Upload a large banner-style image for your store page.
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
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const startStripeOnboarding = async () => {
    setLoading(true);
    try {
      const onboard = httpsCallable(getFunctions(undefined, 'us-central1'), 'onboardStripe');
      const res: any = await onboard({
        appBaseUrl: window.location.origin,
      });
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
            disabled={loading || !!profile?.stripeAccountId}
            className="w-full"
          >
            {profile?.stripeAccountId ? 'Connected' : loading ? 'Connecting…' : 'Connect Stripe'}
          </Button>
        </CardContent>
      </Card>

      <FormField
        control={control}
        name="stripeOnboarded"
        render={({ field }) => (
          <FormItem className="flex gap-3 items-start border p-4 rounded">
            <Checkbox checked={field.value} disabled={!!profile?.stripeAccountId} onCheckedChange={field.onChange} />
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

/* ---------------- STEP 3 ---------------- */

const Step3SellerTerms = () => {
  const { control } = useFormContext<SellerFormValues>();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">Seller Terms</p>
          <p className="text-sm text-muted-foreground">
            You must accept the Seller Terms before you can sell.
          </p>
          <p className="text-sm text-muted-foreground">
            No offsite sales allowed. If suspected of selling or attempting to sell offsite,
            sellers will be permanently banned without warning.
          </p>
          <p className="text-sm">
            <a href="/seller-terms" className="text-primary underline">
              Read Seller Terms
            </a>
          </p>
        </CardContent>
      </Card>

      <FormField
        control={control}
        name="agreeSellerTerms"
        render={({ field }) => (
          <FormItem className="flex gap-3 items-start border p-4 rounded">
            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} />
            <div>
              <FormLabel>I agree to the Seller Terms</FormLabel>
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
  const { user, profile, loading: authLoading } = useAuth();
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
      stripeOnboarded: profile?.stripeOnboarded ?? false,
      agreeSellerTerms: !!profile?.stripeTermsAgreed,
    },
  });

  // If profile loads after render, update the form value to reflect completion state
  useEffect(() => {
    if (profile && typeof methods.setValue === 'function') {
      methods.setValue('stripeOnboarded', !!profile.stripeOnboarded || !!profile.stripeAccountId);
      // Only update agreeSellerTerms if the user hasn't checked it yet (i.e., still default)
      const current = methods.getValues('agreeSellerTerms');
      if (current === false || current === undefined) {
        methods.setValue('agreeSellerTerms', !!profile.stripeTermsAgreed);
      }
    }
  }, [profile]);

  async function onSubmit(values: SellerFormValues) {
    if (!user || !firestore || !profile?.displayName) return;

    setSaving(true);
    let storeRef: ReturnType<typeof doc> | undefined = undefined;

    try {
      const slug = profile.displayName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const userRef = doc(firestore, 'users', user.uid);

      // Persist seller-terms acceptance before creating the store so rules that
      // read users/{uid} can validate it during storefront create.
      // Ensure all required fields for userCanCreateStore are set before creating the store
      await updateDoc(userRef, {
        storeId: '',
        stripeOnboarded: true,
        stripeAccountId: profile.stripeAccountId ?? null,
        stripeTermsAgreed: true,
        updatedAt: serverTimestamp(),
      });

      storeRef = doc(collection(firestore, 'storefronts'));

      // Optional: upload store image before the Firestore transaction so we can store the URL.
      let storeImageUrl: string | null = null;
      const pendingFile: File | null =
        typeof window !== 'undefined'
          ? ((window as any).__pendingStoreImageFile as File | null)
          : null;

      if (pendingFile && storage && storeRef) {
        const storageRef = ref(
          storage,
          `storeImages/${user.uid}/${storeRef.id}/${pendingFile.name}`
        );
        await uploadBytes(storageRef, pendingFile);
        storeImageUrl = await getDownloadURL(storageRef);
      }

      if (!storeRef) throw new Error('StoreRef not initialized');

      await runTransaction(firestore, async (tx) => {
        // Only set isSeller if user is emailVerified
        tx.update(userRef, {
          isSeller: user.emailVerified === true,
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
          storeImageUrl,
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
          path: `storefronts/${storeRef?.id ?? '[unknown]'}`,
          operation: 'write',
        })
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6">Loading…</div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6">You must be signed in.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Create Store' : step === 2 ? 'Connect Stripe' : 'Accept Seller Terms'}
            </CardTitle>
            <CardDescription>Step {step} of 3</CardDescription>
          </CardHeader>

          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1Store key="s1" />}
                  {step === 2 && <Step2Stripe key="s2" />}
                  {step === 3 && <Step3SellerTerms key="s3" />}
                </AnimatePresence>

                <div className="flex justify-between mt-6">
                  {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <Button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))}>
                      Next
                    </Button>
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
