'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
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

// Add imports for form components
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  about: z.string().min(20, 'Please provide at least 20 characters.'),
  theme: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ClientStoreSetup() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { about: '', theme: '' },
  });

  // Retrieve user and profile from your auth hook
  const { user, profile, refreshProfile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const toaster = useToast();
  const [loading, setLoading] = useState(false);

  // Theme selector state
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState("");

  useEffect(() => {
    async function fetchThemes() {
      if (!user || !profile || !firestore) return;
      setThemeLoading(true);
      setThemeError("");
      try {
        const userRef = doc(firestore, "users", user.uid);
        const snap = await import('firebase/firestore').then(m => m.getDoc(userRef));
        if (snap.exists()) {
          setOwnedThemes(snap.data().ownedThemes || []);
        }
      } catch (e: any) {
        setThemeError("Could not load themes.");
      } finally {
        setThemeLoading(false);
      }
    }
    fetchThemes();
  }, [user, profile, firestore]);

  async function onSubmit(values: FormValues) {
    if (!user || !profile || !firestore || profile.status !== "ACTIVE") return;
    // ...existing code...
    if (!profile.stripeAccountId) {
      toaster.toast({
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
        theme: values.theme || '',
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

      toaster.toast({
        title: 'Store created',
        description: 'Your store is live.',
        variant: 'default',
      });

      // Always redirect to the new store page after creation
      router.replace(`/store/${storeRef.id}`);
    } catch (err: any) {
      console.error(err);
      toaster.toast({
        variant: 'destructive',
        title: 'Store creation failed',
        description: getFriendlyErrorMessage(err?.message ?? 'Firestore blocked the operation.'),
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

              {/* Theme Selector */}
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Theme</FormLabel>
                    <FormControl>
                      {themeLoading ? (
                        <div className="text-muted-foreground py-2">Loading themes…</div>
                      ) : themeError ? (
                        <div className="text-red-500 py-2">{themeError}</div>
                      ) : ownedThemes.length === 0 ? (
                        <div className="text-muted-foreground py-2 italic">No themes available yet.</div>
                      ) : (
                        <select
                          {...field}
                          className="w-full rounded border px-2 py-2 bg-background"
                        >
                          <option value="">Default</option>
                          {ownedThemes.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <span className="flex items-center justify-center"><span className="animate-spin mr-2 w-4 h-4 border-2 border-t-2 border-gray-300 rounded-full"></span>Creating…</span> : 'Create Store'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
