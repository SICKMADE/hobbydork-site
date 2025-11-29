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
import { useRouter } from 'next/navigation';


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function AuthComponent() {
  const { login } = useAuth();
  const router = useRouter();


  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onLogin(values: z.infer<typeof loginSchema>) {
    login(values.email, values.password);
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
            <TabsTrigger value="signup" onClick={() => router.push('/signup')}>Sign Up</TabsTrigger>
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
                          <FormLabel>Password</FormLabel>
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
            {/* This content is just a placeholder as the user will be redirected */}
             <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                 <p className="text-center text-muted-foreground">Redirecting to Sign Up...</p>
             </div>
          </TabsContent>
        </Tabs>
         <p className="px-8 mt-4 text-center text-sm text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link> and <Link href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
          </p>
          <p className="px-8 mt-2 text-center text-sm text-muted-foreground">
            Must be 18+ to create an account. One account per person.
          </p>
      </div>
    </div>
  );
}
