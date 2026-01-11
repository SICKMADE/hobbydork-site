'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/client';
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
      if (!signIn) throw new Error('Sign in is not available.');
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
      if (!signUp) throw new Error('Sign up is not available.');
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

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      toast({
        title: 'Password reset sent',
        description: 'Check your email for a reset link.',
      });
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description: err?.message || 'Could not send reset email.',
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
              <button
                className="text-xs text-blue-700 underline"
                onClick={() => setTab('reset' as any)}
                type="button"
              >
                Forgot password?
              </button>
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

          <TabsContent value="reset">
            <form onSubmit={onResetPassword} className="space-y-4">
              <div>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit">Send password reset</Button>
              {resetSent && (
                <div className="text-green-700 text-xs mt-2">Reset email sent!</div>
              )}
            </form>
            <div className="mt-4 text-center">
              <button
                className="text-xs text-blue-700 underline"
                onClick={() => setTab('login')}
                type="button"
              >
                Back to login
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
