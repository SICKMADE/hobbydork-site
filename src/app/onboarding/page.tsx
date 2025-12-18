'use client';

import React, { useState } from 'react';
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
} from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// ✅ CLEAN AGREEMENTS — NO STRIPE / NO GOODS & SERVICES
const agreementsSchema = z.object({
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms.' }),
  }),
  agreeAge: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 18 or older.' }),
  }),
  agreeOneAccount: z.literal(true, {
    errorMap: () => ({ message: 'Only one account is allowed.' }),
  }),
});

type OnboardingFormValues = z.infer<typeof agreementsSchema>;

const StepAgreements = () => {
  const { control } = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-4">
      {['agreeTerms', 'agreeAge', 'agreeOneAccount'].map((name) => (
        <FormField
          key={name}
          control={control}
          name={name as keyof OnboardingFormValues}
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 border p-4 rounded">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
              </FormControl>
              <FormLabel className="leading-snug">
                {name === 'agreeTerms' && 'I agree to the Terms of Service.'}
                {name === 'agreeAge' && 'I confirm I am at least 18 years old.'}
                {name === 'agreeOneAccount' &&
                  'I understand only one account is allowed.'}
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(agreementsSchema),
    defaultValues: {
      agreeTerms: false,
      agreeAge: false,
      agreeOneAccount: false,
    },
  });

  async function onSubmit() {
    if (!user || !firestore) return;

    setIsSubmitting(true);

    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        oneAccountAcknowledged: true,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Welcome to HobbyDork',
        description: 'Your account is ready.',
      });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Setup failed',
        description: err.message ?? 'Permission denied',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-xl w-full">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Finish setup</CardTitle>
            <CardDescription>
              Before using HobbyDork, please confirm the following.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <Form {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                  <StepAgreements />
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !methods.formState.isValid}
                    >
                      {isSubmitting ? 'Saving…' : 'Continue'}
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
