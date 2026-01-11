'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  about: z.string().min(10, 'Tell buyers a little about your store'),
});

type FormValues = z.infer<typeof schema>;

export default function ClientStoreSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { about: '' },
  });

  async function onSubmit(values: FormValues) {
    if (!user || !profile || !firestore || profile.status !== "ACTIVE") return;
    // ...existing code...
    if (!profile.stripeAccountId) {
      toast({
        variant: 'destructive',
        title: 'Stripe not connected',
        description: 'Please complete Stripe onboarding first.',
      });
      return;
    }

    setLoading(true);

    try {
      const storeRef = doc(firestore, 'stores', profile.storeId || user.uid);

      await setDoc(storeRef, {
        storeId: storeRef.id,
        ownerUid: user.uid,
        storeName: profile.displayName,
        about: values.about,
        status: 'ACTIVE',
        ratingAverage: 0,
        ratingCount: 0,
        itemsSold: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update user's profile with new storeId
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        storeId: storeRef.id,
        isSeller: true,
        sellerStatus: 'ACTIVE',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Refresh profile to ensure up-to-date state
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }

      toast({
        title: 'Store created',
        description: 'Your store is live.',
      });

      // Always redirect to the new store page after creation
      router.replace(`/store/${storeRef.id}`);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Store creation failed',
        description: err?.message ?? 'Firestore blocked the operation.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create your store</CardTitle>
          <CardDescription>
            Finish setting up your seller storefront.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About your store</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What do you sell? What should buyers know?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating…' : 'Create Store'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
