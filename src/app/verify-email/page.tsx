'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { db } from '@/firebase/client';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Loader2, Terminal } from 'lucide-react';
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
      toast({ title: "Email Sent", description: "Check your inbox for the verification link." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: getFriendlyErrorMessage(error) });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user || !auth) return;
    setIsChecking(true);
    try {
      await reload(user);
      const refreshedUser = auth.currentUser;
      if (refreshedUser?.emailVerified) {
        // FORCE DATABASE SYNC - Update explicit fields
        await updateDoc(doc(db, 'users', refreshedUser.uid), { 
          emailVerified: true,
          status: 'ACTIVE',
          updatedAt: serverTimestamp()
        });
        toast({ title: "Identity Confirmed", description: "Uplink established. Redirecting to hub..." });
        router.replace('/onboarding');
      } else {
        toast({ variant: 'destructive', title: "Identity Pending", description: "Please click the link in your email first." });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Sync Failed", description: getFriendlyErrorMessage(error) });
    } finally {
      setIsChecking(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <div className="max-w-md w-full space-y-10 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-accent/10 rounded-[2.5rem] mb-4 border-2 border-accent/20 shadow-xl">
              <Mail className="w-12 h-12 text-accent animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-black uppercase italic tracking-tighter">Verify Identity</h1>
            <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.4em]">Protocol: EMAIL_VERIFICATION_V2.4</p>
          </div>

          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card">
            <CardHeader className="bg-zinc-950 text-white p-10">
              <CardTitle className="text-2xl font-headline font-black uppercase italic tracking-tight">Identity Sync</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Terminal className="w-3 h-3 text-accent" />
                <CardDescription className="text-white/60 font-mono font-bold text-xs truncate">{user?.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <p className="text-base text-muted-foreground leading-relaxed font-medium italic">We have dispatched a secure authorization link to your address. Click the link to Establishing a stable connection to the collector network.</p>
              <div className="space-y-4 pt-4">
                <Button onClick={handleCheckStatus} disabled={isChecking} className="w-full h-20 bg-primary text-white font-black text-xl rounded-2xl shadow-2xl active:scale-95 transition-all">
                  {isChecking ? <Loader2 className="w-8 h-8 animate-spin" /> : "Establish Connection"}
                </Button>
                <Button variant="outline" onClick={handleResend} disabled={isResending || isChecking} className="w-full h-14 rounded-2xl border-4 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-50">
                  {isResending ? <Loader2 className="animate-spin w-4 h-4" /> : "Request New Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.3em]">HobbyDork Identity Node • Secure Access Only</p>
          </div>
        </div>
      </main>
    </div>
  );
}
