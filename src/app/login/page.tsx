'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Zap, Loader2, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { useState } from 'react';
import Image from 'next/image';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsProcessing(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      toast({ title: "Entry Granted", description: "Welcome to hobbydork." });

      if (!user.emailVerified) {
        router.push('/verify-email');
      } else {
        router.push('/onboarding');
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
    if (!auth || !email || !password) return;
    setIsProcessing(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      toast({ title: "Account Created", description: "Verification email sent. Please check your inbox." });
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
      toast({ title: "Welcome Back", description: "Identity verified." });
      
      if (!result.user.emailVerified) {
        router.push('/verify-email');
      } else {
        router.push('/onboarding');
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
          <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.3em]">Verified Social Marketplace</p>
        </div>

        <Card className="border-2 border-red-700 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
          <CardHeader className="bg-[#222222] rounded-t-[2.5rem] text-white p-5 sm:p-8 pb-10 sm:pb-12">
            <CardTitle className="text-xl sm:text-2xl font-headline font-black italic uppercase tracking-tight">
              Community Access
            </CardTitle>
            <CardDescription className="text-white/60 font-medium">
              Join 500k collectors in the definitive trade hub.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-5 sm:p-8 -mt-8">
            <Tabs defaultValue="login" className="space-y-6 sm:space-y-8">
              <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14 bg-muted rounded-2xl p-1.5 shadow-inner mt-6">
                <TabsTrigger value="login" className="rounded-xl font-black uppercase text-[10px] tracking-widest text-white data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-700">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-xl font-black uppercase text-[10px] tracking-widest text-white data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-700">
                  Join Now
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email-signin"
                        type="email" 
                        placeholder="collector@hobbydork.com" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-white text-black"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin" className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="password-signin"
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-white text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full h-14 bg-red-700 text-white hover:bg-red-800 font-black rounded-xl shadow-xl transition-all active:scale-95 gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                    Unlock My Vault
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email-signup"
                        type="email" 
                        placeholder="collector@hobbydork.com" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-white text-black"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="password-signup"
                        type="password" 
                        placeholder="Create a strong password" 
                        className="pl-11 h-12 rounded-xl border-2 font-medium bg-white text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full h-14 bg-accent text-white hover:bg-accent/90 font-black rounded-xl shadow-xl transition-all active:scale-95 gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    Create Collector Account
                  </Button>
                </form>
              </TabsContent>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-card px-4 text-muted-foreground tracking-widest">Or social login</span></div>
              </div>

              <Button 
                onClick={handleGoogleLogin} 
                disabled={isProcessing}
                variant="outline"
                className="w-full h-14 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-50 transition-all gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
          hobbydork standard security protocol
        </p>
      </div>
    </div>
  );
}
