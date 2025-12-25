'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField } from '@/components/ui/form';

// Zod schemas for form validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function AuthComponent({
  initialTab = 'login',
}: {
  initialTab?: 'login' | 'signup';
}) {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [tab, setTab] = React.useState<'login' | 'signup'>(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
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
      const cred = await login(values.email, values.password);
      if (cred.user?.emailVerified) {
        router.replace('/');
      } else {
        router.replace('/verify-email');
      }
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      let message = 'Login failed.';
      if (code === 'auth/user-not-found') {
        message = 'No account found with that email.';
      } else if (code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      }
      toast({
        title: 'Login Error',
        description: message,
        variant: 'destructive',
      });
    }
  }

  async function onSignup(values: z.infer<typeof signupSchema>) {
    try {
      await signup(values.email, values.password, values.displayName);

      toast({
        title: 'Verify your email',
        description:
          'We sent you a verification link. You must verify before continuing.',
      });

      router.push('/verify-email');
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      let message = 'Signup failed.';
      if (code === 'auth/email-already-in-use') {
        message = 'An account with that email already exists.';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak.';
      }
      toast({
        title: 'Signup Error',
        description: message,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 relative">
            <Image
              src="/hobbydork-head.png"
              alt="HobbyDork"
              fill
              className="object-contain"
              import {
                Form,
                FormControl,
                FormField,
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
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginForm.formState.isSubmitting}
                    >
                      Log In
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup">
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-6">
                <h3 className="text-2xl font-semibold">Create Account</h3>
                <p className="text-sm text-muted-foreground">
                  Email verification required before use.
                </p>
              </div>
              <div className="p-6 pt-0">
                <Form {...signupForm}>
                  <form
                    onSubmit={signupForm.handleSubmit(onSignup)}
                    className="space-y-4"
                  >
                    <FormField
                      control={signupForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Choose carefully — this cannot be changed later.
                          </p>
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
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
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
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
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
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signupForm.formState.isSubmitting}
                    >
                      Create Account
                    </Button>
                  </form>
                </Form>
              </div>

              <div className="p-6 pt-0 text-center text-sm text-muted-foreground">
                Must be 18+. One account per person. By creating an account you
                agree to the{' '}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
