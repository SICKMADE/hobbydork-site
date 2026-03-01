'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { reload } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { filterProfanity } from '@/lib/utils';

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

      // Force a reload to ensure we have the absolute latest verification status from Firebase Auth
      try {
        await reload(user);
      } catch (e) {
        console.error("Auth reload failed", e);
      }

      // Final check: If still not verified after reload, send back
      if (!auth.currentUser?.emailVerified) {
        router.push('/verify-email');
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        // If user already has a handle, they shouldn't be here
        if (docSnap.exists() && docSnap.data().username) {
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
  }, [user, authLoading, db, auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !user || !db) return;

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      toast({ variant: 'destructive', title: "Username Too Short", description: "Handles must be at least 3 characters." });
      return;
    }

    // Check for profanity in username
    const filteredUsername = filterProfanity(cleanUsername);
    if (filteredUsername.includes('*')) {
      toast({ 
        variant: 'destructive', 
        title: "Invalid Handle", 
        description: "Handle contains restricted language. Please choose another." 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Uniqueness check via Username Registry
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        toast({ 
          variant: 'destructive', 
          title: "Handle Taken", 
          description: "This username is already claimed by another collector." 
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Prepare atomic write batch
      const batch = writeBatch(db);
      
      // Reserve the username
      batch.set(usernameRef, { uid: user.uid });

      // Create the user profile
      const userRef = doc(db, 'users', user.uid);
      const profileData = {
        uid: user.uid,
        username: cleanUsername,
        storeId: cleanUsername,
        email: user.email,
        // CRITICAL: Force this to true since they passed the auth gate
        // This ensures Security Rules (which check the doc) allow access immediately
        emailVerified: true, 
        role: 'USER',
        status: 'ACTIVE',
        isSeller: false,
        sellerStatus: 'NONE',
        premiumItems: [],
        photoURL: user.photoURL || '',
        displayName: user.displayName || cleanUsername,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stripeOnboarded: false,
        stripeTermsAgreed: false,
      };

      batch.set(userRef, profileData, { merge: true });
      
      // 3. Commit the batch
      await batch.commit();
      
      toast({ title: "Identity Secured!", description: `Welcome to hobbydork, @${cleanUsername}!` });
      
      // Small delay to allow Firestore cache to catch up before redirecting to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);

    } catch (e: any) {
      console.error("Onboarding error:", e);
      toast({ 
        variant: 'destructive', 
        title: "Setup Failed", 
        description: e.message || "An unexpected error occurred during profile creation." 
      });
      setIsSubmitting(false);
    }
  };

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Identity</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-accent/10 rounded-3xl mb-4"><Sparkles className="w-8 h-8 md:w-10 md:h-10 text-accent" /></div>
          <h1 className="text-3xl md:text-4xl font-headline font-black italic tracking-tighter uppercase">Choose Your Handle</h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base">Your permanent identity on hobbydork.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary text-white p-6 md:p-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl font-black italic uppercase tracking-tight">Identity Setup</CardTitle>
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-10 space-y-6">
            <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-2xl">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs font-bold uppercase tracking-tight">Username cannot be changed later.</AlertDescription>
            </Alert>

            <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Username</Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">@</span>
                  <Input 
                    id="username" 
                    placeholder="handle" 
                    className="pl-12 h-14 md:h-16 rounded-xl md:rounded-2xl border-2 text-lg md:text-xl font-black" 
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
          <CardFooter className="p-6 md:p-8 bg-zinc-50 border-t flex flex-col gap-4">
            <Button type="submit" form="onboarding-form" disabled={isSubmitting || !username.trim()} className="w-full h-14 md:h-16 bg-accent hover:bg-accent/90 text-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl active:scale-95">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Securing Vault...
                </>
              ) : "Confirm Handle"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
