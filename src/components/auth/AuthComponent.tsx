'use client';

import { useAuth } from '@/lib/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '../Logo';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  }),
  isOver18: z.literal(true, {
    errorMap: () => ({ message: "You must be 18 or older." }),
  }),
  acknowledge: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge these statements." }),
  }),
});

export default function AuthComponent() {
  const { login, signup } = useAuth();
  const { toast } = useToast();


  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '' },
  });

  function onLogin(values: z.infer<typeof loginSchema>) {
    login(values.email);
  }

  function onSignup(values: z.infer<typeof signupSchema>) {
    signup(values.name, values.email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold tracking-tight text-2xl">Welcome Back</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your email to access your vault.
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
                            <Input placeholder="active@test.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Login
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
                  Join the community and start your collection.
                </p>
              </div>
              <div className="p-6 pt-0">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-6">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Collector Carl" {...field} />
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
                            <Input placeholder="carl@collector.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I accept the{' '}
                              <Link href="/#" className="text-primary hover:underline">
                                Terms of Service
                              </Link>{' '}
                              and{' '}
                              <Link href="/#" className="text-primary hover:underline">
                                Privacy Policy
                              </Link>
                              .
                            </FormLabel>
                             <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                     <FormField
                      control={signupForm.control}
                      name="isOver18"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I confirm that I am 18 years of age or older.
                            </FormLabel>
                             <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="acknowledge"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                           <div className="space-y-1 leading-none">
                            <FormLabel>
                              I understand that only one account is permitted per person and that I must use "Goods & Services" for all P2P payments for my own protection.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
         <p className="px-8 mt-4 text-center text-sm text-muted-foreground">
            Hint: Try logging in with <code className="bg-muted p-1 rounded">active@test.com</code>, <code className="bg-muted p-1 rounded">limited@test.com</code>, or <code className="bg-muted p-1 rounded">suspended@test.com</code>.
          </p>
      </div>
    </div>
  );
}
