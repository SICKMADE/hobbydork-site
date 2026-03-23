'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Mail, 
  Lock, 
  UserPlus, 
  LogIn,
  KeyRound,
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { useState } from 'react';
import Image from 'next/image';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { getRandomAvatar, filterProfanity } from '@/lib/utils';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsProcessing(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      toast({ title: "Welcome", description: "Identity confirmed." });

      if (!user.emailVerified) {
        router.push('/verify-email');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive',
        title: "Sign In Failed", 
        description: getFriendlyErrorMessage(error) 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db || !email || !password) return;
    
    if (!agreedToTerms) {
      toast({ variant: 'destructive', title: "Agreement Required", description: "You must certify your age and agree to terms." });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      toast({ variant: 'destructive', title: "Handle Too Short", description: "Must be at least 3 characters." });
      return;
    }

    const filtered = filterProfanity(cleanUsername);
    if (filtered.includes('*')) {
      toast({ variant: 'destructive', title: "Invalid Handle", description: "This username contains restricted language." });
      return;
    }

    setIsProcessing(true);

    try {
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        toast({ variant: 'destructive', title: "Handle Taken", description: "Choose another unique identifier." });
        setIsProcessing(false);
        return;
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', result.user.uid);
      const photoURL = getRandomAvatar(result.user.uid);

      batch.set(userRef, {
        uid: result.user.uid,
        username: cleanUsername,
        storeId: cleanUsername,
        email: email.toLowerCase(),
        photoURL,
        status: 'ACTIVE',
        role: 'USER',
        isSeller: false,
        emailVerified: false,
        agreedToTerms: true,
        isOfAge: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      batch.set(usernameRef, { uid: result.user.uid });

      await batch.commit();
      await sendEmailVerification(result.user);

      toast({ title: "Account Created", description: "Welcome @"+cleanUsername+". Please verify your email." });
      router.push('/verify-email');
    } catch (error: any) {
      toast({ 
        variant: 'destructive',
        title: "Registration Failed", 
        description: getFriendlyErrorMessage(error) 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;
    setIsProcessing(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Welcome Back" });
      
      if (!result.user.emailVerified) {
        router.push('/verify-email');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive',
        title: "Login Failed", 
        description: "Invalid email or password. Please try again." 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetEmail) return;
    setIsResetting(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Reset Email Sent",
        description: `Check ${resetEmail} for instructions.`
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Request Failed",
        description: getFriendlyErrorMessage(error)
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image 
              src="/hobbydork-main.png" 
              alt="hobbydork" 
              width={360} 
              height={90} 
              className="h-20 md:h-24 w-auto" 
              priority 
            />
          </div>
          <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.2em]">The Social Marketplace for Collectors</p>
        </div>

        <Card className="border-2 border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
          <CardHeader className="bg-zinc-950 text-white dark:bg-card dark:text-white p-8 pb-12">
            <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight italic">
              Sign In
            </CardTitle>
            <CardDescription className="text-white/60 dark:text-muted-foreground font-medium italic">
              Access your dashboard and active trades.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 -mt-8">
            <Tabs defaultValue="login" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-muted rounded-2xl p-1.5 shadow-inner mt-6">
                <TabsTrigger 
                  value="login" 
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-lg dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-lg dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white transition-all"
                >
                  Join
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="login-email-input"
                        name="email"
                        type="email" 
                        placeholder="email@example.com" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-background"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
                      <button 
                        type="button"
                        onClick={() => setIsResetDialogOpen(true)}
                        className="text-[9px] font-black uppercase text-accent hover:underline tracking-widest"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="login-password-input"
                        name="password"
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-background"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-xl shadow-xl transition-all active:scale-95 gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-6">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Handle</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-username-input"
                        name="username"
                        placeholder="username" 
                        className="pl-11 h-12 rounded-xl border-2 font-bold bg-background"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-email-input"
                        name="email"
                        type="email" 
                        placeholder="email@example.com" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-background"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-password-input"
                        name="password"
                        type="password" 
                        placeholder="Min 6 characters" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-background"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-dashed border-zinc-300">
                    <Checkbox 
                      id="signup-age-check" 
                      checked={agreedToTerms} 
                      onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="signup-age-check" className="text-[10px] font-black uppercase leading-tight cursor-pointer">
                        I certify that I am 18 years of age or older.
                      </Label>
                      <p className="text-[9px] text-muted-foreground leading-tight">
                        By joining, you agree to our <Link href="/terms" className="text-accent underline">Terms</Link>.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isProcessing || !agreedToTerms}
                    className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-xl shadow-xl transition-all active:scale-95 gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black">
                  <span className="bg-card px-4 text-muted-foreground tracking-widest">Social Gateway</span>
                </div>
              </div>

              <Button 
                onClick={handleGoogleLogin} 
                disabled={isProcessing}
                variant="outline"
                className="w-full h-14 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest hover:bg-muted transition-all gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Identity
              </Button>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
          hobbydork secure authentication
        </p>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <div className="bg-zinc-950 p-8 text-white dark:bg-card dark:text-white transition-colors">
            <div className="bg-accent/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-accent" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-black uppercase italic tracking-tight">Reset Password</DialogTitle>
              <DialogDescription className="text-zinc-400 dark:text-zinc-500 font-medium pt-1 italic">
                Enter your email to receive a password reset link.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6 bg-card">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-email-input"
                    name="email"
                    type="email" 
                    placeholder="email@example.com" 
                    className="pl-11 h-12 rounded-xl border-2 font-medium bg-background"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isResetting || !resetEmail}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-xl shadow-xl transition-all active:scale-95 gap-2"
              >
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                Send Reset Link
              </Button>
            </form>
            <div className="text-center">
              <button 
                onClick={() => setIsResetDialogOpen(false)}
                className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary tracking-widest"
              >
                Back to Login
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
