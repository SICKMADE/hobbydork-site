'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { db } from '@/firebase/client';
import { doc, updateDoc } from 'firebase/firestore';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Loader2, RefreshCw, Terminal, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
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
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleResend = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({ title: "Protocol Initiated", description: "Verification link dispatched to your inbox." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Transmission Fault", description: getFriendlyErrorMessage(error) });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user || !auth) return;
    setIsChecking(true);
    try {
      // Force refresh of the auth token/status to catch verification link clicks in other tabs
      await reload(user);
      const refreshedUser = auth.currentUser;
      if (refreshedUser?.emailVerified) {
        // Update Firestore user doc to reflect verified status
        if (refreshedUser.uid) {
          try {
            await updateDoc(doc(db, 'users', refreshedUser.uid), { emailVerified: true });
          } catch (e) {
            // Optionally log or toast error, but don't block navigation
          }
        }
        toast({ title: "Identity Confirmed" });
        router.replace('/dashboard');
      } else {
        toast({ 
          variant: 'destructive',
          title: "Verification Pending", 
          description: "Authorize your identity via the link in your inbox." 
        });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Check Failed", description: getFriendlyErrorMessage(error) });
    } finally {
      setIsChecking(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <Loader2 className="w-10 h-10 animate-spin text-accent" />
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">Syncing Node...</p>
  </div>;

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-4 border-2 border-primary/20">
              <Mail className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black italic tracking-tighter uppercase leading-none text-primary dark:text-white">
              Verify Email
            </h1>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Awaiting Identity Confirmation</p>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
            <CardHeader className="bg-zinc-900 dark:bg-zinc-900 text-white p-6 sm:p-8 border-b border-white/5 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <Terminal className="w-5 h-5 text-accent opacity-50" />
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-black italic uppercase tracking-tight">Identity Uplink</CardTitle>
              <CardDescription className="text-white/70 dark:text-muted-foreground font-bold text-xs truncate">Target: {user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium italic">
                Authorized network access requires a verified email node. Check your inbox to complete the handshake.
              </p>
              
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={handleCheckStatus} 
                  disabled={isChecking}
                  className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
                >
                  {isChecking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                  Check Status
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleResend} 
                  disabled={isResending || isChecking}
                  className="w-full h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest text-primary dark:text-white"
                >
                  {isResending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Resend Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">hobbydork secure access node</p>
          </div>
        </div>
      </main>
    </div>
  );
}
