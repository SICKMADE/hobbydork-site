'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

export default function VerifyEmailPage() {
  const { user, isUserLoading: authLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user?.emailVerified) {
      router.push('/onboarding');
    }
  }, [user, authLoading]);

  const handleResend = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({ title: "Email Sent", description: "A new verification link has been delivered." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Resend Failed", description: error.message });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user || !auth) return;
    setIsChecking(true);
    try {
      // Force reload to get the latest status from the server
      await reload(user);
      
      // Access the refreshed instance directly
      if (auth.currentUser?.emailVerified) {
        toast({ title: "Identity Confirmed", description: "Welcome to hobbydork!" });
        
        // Use router.replace to prevent back-button loops
        router.replace('/onboarding');
      } else {
        toast({ 
          variant: 'destructive',
          title: "Not Verified Yet", 
          description: "We couldn't confirm your verification. Please click the link in the email we sent you." 
        });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "System Check Failed", description: error.message });
    } finally {
      setIsChecking(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-3xl mb-4">
              <Mail className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black italic tracking-tighter uppercase leading-none">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground font-medium">We need to ensure you're a real collector.</p>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-primary text-white p-5 sm:p-8">
              <CardTitle className="text-lg sm:text-xl font-black italic uppercase tracking-tight">Check Your Inbox</CardTitle>
              <CardDescription className="text-white/70">A link was sent to {user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                To prevent scams and maintain community integrity, all members must verify their email address before listing items or chatting on hobbydork.
              </p>
              
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={handleCheckStatus} 
                  disabled={isChecking}
                  className="w-full h-16 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95"
                >
                  {isChecking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                  I've Verified My Email
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleResend} 
                  disabled={isResending || isChecking}
                  className="w-full h-14 rounded-2xl border-2 font-bold"
                >
                  {isResending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Resend Verification Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
