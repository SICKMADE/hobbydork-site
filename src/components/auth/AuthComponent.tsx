'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/client-provider';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function AuthComponent({
  initialTab = 'login',
}: {
  initialTab?: 'login' | 'signup';
}) {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = React.useState<'login' | 'signup'>(initialTab);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetSent, setResetSent] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  async function onForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetSent(false);
    setResetError(null);
    try {
      if (!auth) throw new Error('Auth is not initialized.');
      await sendPasswordResetEmail(auth as import('firebase/auth').Auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setResetError(err?.message || 'Could not send reset email.');
    }
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    try {
      await signIn(values.email, values.password);
      router.replace('/');
    } catch (e: any) {
      toast({
        title: 'Login failed',
        description: e?.message ?? 'Invalid credentials',
        variant: 'destructive',
      });
    }
  }

  async function onSignup(values: z.infer<typeof signupSchema>) {
    try {
      await signUp(values.email, values.password, values.displayName);
      toast({
        title: 'Verify your email',
        description: 'Check your inbox. Your account unlocks after verification.',
      });
      router.replace('/verify-email');
    } catch (e: any) {
      toast({
        title: 'Signup failed',
        description: e?.message ?? 'Could not create account',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="relative h-24 w-24">
            <Image src="/hobbydork-head.png" alt="HobbyDork" fill />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit">Log In</Button>
              </form>
            </Form>
            <div className="mt-4 text-center">
              <form onSubmit={onForgotPassword} className="flex flex-col items-center gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email to reset password"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="max-w-xs"
                  required
                />
                <Button type="submit" variant="link" className="p-0 h-auto text-xs">Forgot password?</Button>
              </form>
              {resetSent && <div className="text-green-600 text-xs mt-1">Password reset email sent.</div>}
              {resetError && <div className="text-red-600 text-xs mt-1">{resetError}</div>}
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit">Create Account</Button>
              </form>
            </Form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By creating an account you agree to the{' '}
              <Link href="/terms" className="underline">Terms</Link> and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
