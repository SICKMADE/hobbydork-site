
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

// change this path/filename to match your actual PNG under components/dashboard
import storeDefaultAvatar from '@/components/dashboard/store-default.png';

const storeSchema = z.object({
  about: z.string().min(10, 'About section must be at least 10 characters long.'),
});

const paymentSchema = z.object({
  stripeOnboarded: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must complete Stripe onboarding to sell on this platform.',
    }),
  goodsAndServicesAgreed: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the Goods & Services policy.',
    }),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

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
          Your store&apos;s unique URL is generated from your display name and cannot be
          changed.
        </FormDescription>
      </div>
      <FormField
        control={control}
        name="about"
        render={({ field }) => (
          <FormItem>
            <FormLabel>About Your Store</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell everyone what makes your store special..."
                {...field}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};

const Step2Payment = () => {
  const { control } = useFormContext<SellerFormValues>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnboarding, setIsOnboarding] = useState(false);

  const handleStripeOnboard = async () => {
    setIsOnboarding(true);
    try {
      const onboard = httpsCallable(functions, 'onboardStripe');
      const result = await onboard({});
      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast({
          variant: 'destructive',
          title: 'Onboarding Failed',
          description: 'Failed to start Stripe onboarding.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to connect to Stripe.',
      });
    } finally {
      setIsOnboarding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div>
          <FormLabel className="text-lg font-semibold">Stripe Payment Setup</FormLabel>
          <FormDescription className="mt-2">
            To sell on HobbyDork, you must connect a Stripe account for secure payment processing.
            This is required for all sellers.
          </FormDescription>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h3 className="font-semibold">Stripe Connect</h3>
                <p className="text-sm text-muted-foreground">Secure payment processing</p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleStripeOnboard}
              disabled={isOnboarding}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isOnboarding ? 'Connecting...' : 'Connect Stripe Account'}
            </Button>

            <p className="text-xs text-muted-foreground mt-3">
              You'll be redirected to Stripe to complete verification. This usually takes 5-10 minutes.
            </p>
          </CardContent>
        </Card>

        <FormField
          control={control}
          name="stripeOnboarded"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I have completed Stripe onboarding and my account is ready to receive payments.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="goodsAndServicesAgreed"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(!!checked)}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                I agree that all payments for sales on this platform will be sent using
                Goods &amp; Services (no Friends &amp; Family or off-platform payments).
                This is required to reduce scams and protect both buyer and seller.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </motion.div>
  );
};

export default function CreateStorePage() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    mode: 'onChange',
    defaultValues: {
      about: '',
      paymentMethod: profile?.paymentMethod || 'PAYPAL',
      paymentIdentifier: profile?.paymentIdentifier || '',
      goodsAndServicesAgreed: profile?.goodsAndServicesAgreed || false,
    },
  });

  useEffect(() => {
    if (profile?.paymentMethod) {
      methods.setValue('paymentMethod', profile.paymentMethod);
    }
    if (profile?.paymentIdentifier) {
      methods.setValue('paymentIdentifier', profile.paymentIdentifier);
    }
    if (profile?.goodsAndServicesAgreed !== undefined) {
      methods.setValue('goodsAndServicesAgreed', profile.goodsAndServicesAgreed);
    }
  }, [profile, methods]);

  const handleNext = async () => {
    const fieldsToValidate: (keyof SellerFormValues)[] = ['about'];
    const isValid = await methods.trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  async function onSubmit(values: SellerFormValues) {
    if (!user || !firestore || !profile?.displayName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not properly signed in or missing a display name.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const storeName = profile.displayName;
      const slug = storeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const newStoreRef = doc(collection(firestore, 'storefronts'));
      const userProfileRef = doc(firestore, 'users', user.uid);

      await runTransaction(firestore, async (transaction) => {
        transaction.update(userProfileRef, {
          isSeller: true,
          storeId: newStoreRef.id,
          paymentMethod: values.paymentMethod,
          paymentIdentifier: values.paymentIdentifier,
          goodsAndServicesAgreed: values.goodsAndServicesAgreed,
          updatedAt: serverTimestamp(),
        });

        transaction.set(newStoreRef, {
          id: newStoreRef.id,
          storeId: newStoreRef.id,
          ownerUid: user.uid,
          storeName,
          slug,
          about: values.about,
          avatarUrl: storeDefaultAvatar.src, // your PNG
          ratingAverage: 0,
          ratingCount: 0,
          itemsSold: 0,
          status: 'ACTIVE',
          isSpotlighted: false,
          spotlightUntil: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      toast({
        title: 'Your Store is Live!',
        description: 'Congratulations! You can now start listing items for sale.',
      });
      router.push(`/store/${newStoreRef.id}`);
      router.refresh();
    } catch (error) {
      const contextualError = new FirestorePermissionError({
        path: `Transaction failed for user/${user?.uid} and storefronts/`,
        operation: 'write',
        requestResourceData: {
          description: 'Transaction to create a store and update user profile.',
          formData: values,
        },
      });
      errorEmitter.emit('permission-error', contextualError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepDetails = [
    {
      title: 'Set Up Your Store',
      description: 'This will be your public identity on HobbyDork.',
    },
    {
      title: 'Set Up Payments',
      description: 'Choose how you want to get paid by buyers.',
    },
  ];

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              {stepDetails[step - 1].title}
            </CardTitle>
            <CardDescription>
              Step {step} of 2: {stepDetails[step - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1Store key="step1" />}
                  {step === 2 && <Step2Payment key="step2" />}
                </AnimatePresence>
                <div className="flex justify-between mt-8">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 2 ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !methods.formState.isValid}
                    >
                      {isSubmitting ? 'Finishing...' : 'Create My Store'}
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
