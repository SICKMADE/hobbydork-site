'use client';

import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '../Logo';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function AuthComponent() {
  const { login, signup } = useAuth();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    await login(values.email, values.password);
  }

  async function onSignup(values: z.infer<typeof signupSchema>) {
    // The use-auth hook will handle the redirect logic after successful signup.
    await signup({
      email: values.email,
      password: values.password,
      oneAccountAcknowledged: true, // These are agreed to in onboarding, but needed for type.
      goodsAndServicesAgreed: true,  // We'll set them to a default true here as they are covered in onboarding.
    });
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
          <TabsContent value="login">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold tracking-tight text-2xl">Welcome Back</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your credentials to access your vault.
                </p>
              </div>
              <div className="p-6 pt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
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
                          <div className="flex justify-between items-baseline">
                            <FormLabel>Password</FormLabel>
                            <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                      {loginForm.formState.isSubmitting ? 'Logging In...' : 'Log In'}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="signup">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold tracking-tight text-2xl">Create an Account</h3>
                    <p className="text-sm text-muted-foreground">
                        You'll set up your store on the next step.
                    </p>
                </div>
                <div className="p-6 pt-0">
                    <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                         <FormField
                            control={signupForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" {...field} />
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
                                    <Input type="password" placeholder="••••••••" {...field} />
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
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                       
                        <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                            {signupForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                    </Form>
                </div>
                 <div className="p-6 pt-0 text-center text-sm text-muted-foreground">
                    Must be 18+. One account per person. By creating an account, you agree to our{' '}
                    <Link href="#" className="underline underline-offset-4 hover:text-primary">
                      Terms of Service
                    </Link> and <Link href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
                  </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
