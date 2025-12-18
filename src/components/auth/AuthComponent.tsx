'use client';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '../Logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z
  .object({
    displayName: z.string().min(3, {
      message: 'Display name must be at least 3 characters.',
    }),
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function AuthComponent() {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
      await login(values.email, values.password);
      // actual redirect happens in use-auth once verified
    } catch (error: any) {
      let message = 'Login failed.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with that email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
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
    } catch (error: any) {
      let message = 'Signup failed.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with that email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
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
          <Logo />
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login">
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-6">
                <h3 className="text-2xl font-semibold">Welcome Back</h3>
                <p className="text-sm text-muted-foreground">
                  Email verification is required.
                </p>
              </div>
              <div className="p-6 pt-0">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
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
                <Link href="#" className="underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="#" className="underline">
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
