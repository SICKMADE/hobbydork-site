
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { reload } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { filterProfanity, getRandomAvatar } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function Onboarding() {
  const { user, isUserLoading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkStatusAndProfile = async () => {
      if (!user || !db || !auth) return;

      try {
        // CRITICAL SYNC: Ensure we have latest verification status to catch link clicks
        await reload(user).catch(() => {});
      } catch (e) {
        console.warn("User status reload failed", e);
      }

      // Gate: Must be verified to pick a handle
      if (!auth.currentUser?.emailVerified) {
        router.push('/verify-email');
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        // If identity manifest already exists, skip to hub
        if (docSnap.exists() && docSnap.data()?.username) {
          router.push('/dashboard');
        } else {
          setIsChecking(false);
        }
      } catch (e) {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        checkStatusAndProfile();
      }
    }
  }, [user, authLoading, db, auth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !user || !db) return;

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      toast({ variant: 'destructive', title: "Handle Too Short", description: "Must be at least 3 characters." });
      return;
    }

    const filteredUsername = filterProfanity(cleanUsername);
    if (filteredUsername.includes('*')) {
      toast({ 
        variant: 'destructive', 
        title: "Forbidden Handle", 
        description: "Restricted language detected. Choose another handle." 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        toast({ 
          variant: 'destructive', 
          title: "Node Unavailable", 
          description: "This handle is already synchronized with another node." 
        });
        setIsSubmitting(false);
        return;
      }

      const batch = writeBatch(db);
      
      // Step 1: Claim Handle
      batch.set(usernameRef, { uid: user.uid });

      // Step 2: Initialize Identity Manifest
      const userRef = doc(db, 'users', user.uid);
      const photoURL = getRandomAvatar(user.uid);

      const profileData = {
        uid: user.uid,
        username: cleanUsername,
        storeId: cleanUsername, // Identity Lock: Username is the StoreID
        email: user.email,
        photoURL,
        emailVerified: true, 
        role: 'USER',
        status: 'ACTIVE',
        isSeller: false,
        sellerStatus: 'NONE',
        ownedPremiumProducts: [],
        displayName: user.displayName || cleanUsername,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stripeOnboarded: false,
        stripeTermsAgreed: false,
      };

      batch.set(userRef, profileData, { merge: true });
      
      // Step 3: Atomic Sync
      await batch.commit();
      
      toast({ title: "Identity Synchronized", description: `Welcome to the network, @${cleanUsername}.` });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);

    } catch (e: any) {
      toast({ 
        variant: 'destructive', 
        title: "Uplink Failed", 
        description: getFriendlyErrorMessage(e)
      });
      setIsSubmitting(false);
    }
  };

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Syncing Identity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-4 border-2 border-primary/20">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-black italic tracking-tighter uppercase leading-none">Identity Sequence</h1>
          <p className="text-muted-foreground font-medium">Choose your permanent network handle.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-black italic uppercase tracking-tight leading-none">Setup Profile</CardTitle>
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-10 space-y-8">
            <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-2xl">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-[10px] font-black uppercase tracking-tight">Warning: Handles are locked once confirmed.</AlertDescription>
            </Alert>

            <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Stencil Handle</Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-2xl">@</span>
                  <Input 
                    id="username" 
                    placeholder="handle" 
                    className="pl-12 h-16 rounded-2xl border-2 text-xl font-black focus-visible:ring-primary shadow-sm" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} 
                    required 
                    autoFocus 
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="p-8 bg-zinc-50 border-t">
            <Button type="submit" form="onboarding-form" disabled={isSubmitting || !username.trim()} className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Securing Node...
                </>
              ) : "Confirm Node Handle"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
