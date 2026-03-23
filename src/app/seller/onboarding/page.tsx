'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/mock-data';
import { 
  Loader2, 
  Clock,
  CheckCircle2,
  MessageSquare,
  Gift,
  ArrowRight,
  Zap,
  Target,
  ShieldCheck,
  AlertTriangle,
  Rocket,
  ShieldAlert,
  Terminal,
  Activity,
  Scan,
  ChevronRight,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { reload } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import Image from 'next/image';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<'pending' | 'complete' | 'incomplete'>('pending');
  const [stripeError, setStripeError] = useState<string | null>(null);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    tagline: '',
    category: '',
    agreedToShipping: false,
    agreedToLegal: false,
    address: {
      line1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });

  useEffect(() => {
    // Always force step 6 after Stripe onboarding redirect (never show step 5 again after Stripe)
    const s = searchParams?.get('step');
    const isStripeReturn = window.location.search.includes('stripe') || window.location.search.includes('onboarding=complete');
    if (isStripeReturn) {
      setStep(6);
      // Optionally, clean up the URL so step=5 or other params don't override
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('step');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    } else if (s) {
      setStep(parseInt(s));
    }
  }, [searchParams]);

  useEffect(() => {
    const runChecks = async () => {
      const isStripeReturn = window.location.search.includes('stripe') || window.location.search.includes('onboarding=complete');
      if (isStripeReturn) {
        // After Stripe, always force step 6, never step 5, and skip all profile checks
        setStep(6);
        return;
      }
      if (!user) return;
      // CRITICAL: Force refresh auth state to ensure emailVerified is accurate
      await reload(user).catch(() => {});
      // Safety Protocol: Must be verified to be a seller
      if (!user.emailVerified) {
        toast({ 
          variant: "destructive", 
          title: "Identity Pending", 
          description: "Verify your email to unlock seller protocols." 
        });
        router.replace('/verify-email');
        return;
      }
      if (profile) {
        if (profile.isSeller) {
          router.replace('/dashboard');
          return;
        }
        // Safety Protocol: Must have a handle before creating a store
        if (!profile.username) {
          toast({ title: "Handle Required", description: "Choose a handle before creating your storefront." });
          router.replace('/onboarding');
          return;
        }
      }
    };
    if (!authLoading && !profileLoading) {
      runChecks();
    }
  }, [profile, profileLoading, user, authLoading, router, toast]);

  const checkStripeStatus = async () => {
    if (!user || !functions || !profile?.stripeAccountId) return;
    setIsVerifying(true);
    setStripeError(null);
    try {
      const getAccount = httpsCallable(functions, 'getStripePayouts');
      await getAccount({ accountId: profile.stripeAccountId });
      setStripeStatus('complete');
      toast({ title: "Connection Authorized" });
    } catch (e: any) {
      setStripeStatus('incomplete');
      setStripeError("Identity connection incomplete. Please verify your details in the Stripe Dashboard.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user || !db || !functions || !profile?.username) {
      toast({ variant: 'destructive', title: 'Data Missing', description: 'Identity profile not yet loaded.' });
      return;
    }
    setIsConnectingStripe(true);
    try {
      // Manifest Hard-Sync: Lock storeId to username for backend validation
      await updateDoc(doc(db, 'users', user.uid), {
        tagline: formData.tagline,
        category: formData.category,
        shippingAddress: formData.address,
        storeId: profile.username, 
        agreedToTerms: true,
        updatedAt: serverTimestamp(),
      });
      
      const origin = window.location.origin;
      const callable = httpsCallable(functions, 'createStripeOnboarding');
      const result = await callable({ appBaseUrl: origin });
      const data = result.data as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Deployment link generation failed.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Connection Fault', description: getFriendlyErrorMessage(e) });
      setIsConnectingStripe(false);
    }
  };


  // Improved: Always force Firestore re-fetch and show loading state after Stripe redirect
  const handleFinalLaunch = async () => {
    if (!functions || !user || !db) return;
    setIsSubmitting(true);
    try {
      // 1. Force reload of Firebase Auth user
      await reload(user).catch(() => {});

      // 2. Force re-fetch of user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) throw new Error('User profile missing after Stripe onboarding.');

      // 3. Optionally, force re-fetch of storefront (if needed)
      if (userSnap.data()?.storeId) {
        const storeRef = doc(db, 'storefronts', userSnap.data().storeId);
        await getDoc(storeRef); // Not used directly, but ensures latest
      }

      // 4. Invalidate any local cache (if using SWR/React Query, trigger revalidation here)
      // (Add cache invalidation logic here if needed)

      // 5. Call backend to finalize seller onboarding
      const finalize = httpsCallable(functions, 'finalizeSeller');
      const result: any = await finalize({});
      if (result.data?.ok) {
        toast({ title: "Storefront Created!", description: "Your shop is now live and ready for customers." });
        router.push('/dashboard');
      } else {
        throw new Error("Handshake failed. Ensure identity verification is complete.");
      }
    } catch (e: any) {
      setStripeError(getFriendlyErrorMessage(e));
      toast({ variant: "destructive", title: "Deployment Error", description: getFriendlyErrorMessage(e) });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-12 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {step} of 7</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">
              {step === 1 && 'Authorization'}
              {step === 2 && 'Social Presence'}
              {step === 3 && 'Drop Mechanics'}
              {step === 4 && 'Delivery Standard'}
              {step === 5 && 'Business Manifest'}
              {step === 6 && 'Verification'}
              {step === 7 && 'Node Deployment'}
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={
                cn(
                  "h-full bg-primary transition-all duration-700 ease-in-out",
                  `onboarding-progress-bar-${Math.round((step / 7) * 100)}`
                )
              }
            />
          </div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <header className="text-center space-y-4">
              <div className="w-24 h-24 bg-muted rounded-none flex items-center justify-center mx-auto mb-6 shadow-xl border border-border overflow-hidden">
                <Image src="/seller.png" alt="Seller Node" width={96} height={96} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-black uppercase tracking-tighter italic leading-none">Become a Seller</h1>
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent bg-accent/5 py-2 px-4 rounded-full border border-accent/10 w-fit mx-auto shadow-sm">
                  <Terminal className="w-3 h-3" /> Reserved Handle: @{profile?.username}
                </div>
              </div>
              <p className="text-muted-foreground font-medium leading-relaxed italic">
                Authorize your seller node and begin high-stakes trading within the network.
              </p>
            </header>
            <Button onClick={() => setStep(2)} className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-xs rounded-none shadow-xl active:scale-95 transition-all">
              Initialize Protocol <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <Card className="border-none shadow-2xl rounded-none overflow-hidden bg-card">
              <CardHeader className="bg-zinc-950 text-white p-8 rounded-none">
                <CardTitle className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic tracking-tight">
                  <MessageSquare className="w-6 h-6 text-accent" /> Store Hub Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6 rounded-none">
                <p className="text-sm font-bold italic text-muted-foreground leading-relaxed">Engage directly with collectors via your social storefront feed.</p>
                <div className="grid gap-4">
                  {["Instant inventory updates", "Direct collector engagement", "Brand pulse tracking"].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button onClick={() => setStep(1)} variant="outline" className="h-16 px-8 rounded-none font-black uppercase text-[10px] tracking-widest border-2">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1 h-16 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none shadow-xl">Next Protocol <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <Card className="border-none shadow-2xl rounded-none overflow-hidden bg-card">
              <CardHeader className="bg-zinc-950 text-white p-8 rounded-none">
                <CardTitle className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic tracking-tight">
                  <Gift className="w-6 h-6 text-accent" /> Prize Drops
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6 rounded-none">
                <div className="p-8 bg-accent/5 rounded-3xl border-4 border-dashed border-accent/20 flex flex-col items-center text-center gap-4">
                  <Zap className="w-12 h-12 text-accent animate-pulse" />
                  <p className="text-sm font-black uppercase tracking-tight leading-relaxed text-primary">Launch giveaways to generate network traffic. Followers enter automatically.</p>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button onClick={() => setStep(2)} variant="outline" className="h-16 px-8 rounded-none font-black uppercase text-[10px] tracking-widest border-2">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1 h-16 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none shadow-xl">Next Protocol <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <Card className="border-none shadow-2xl rounded-none overflow-hidden bg-card">
              <CardHeader className="bg-red-600 text-white p-8 rounded-none">
                <CardTitle className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic tracking-tight">
                  <Clock className="w-6 h-6 text-white" /> Shipping Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8 rounded-none">
                <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-none border-2 border-red-200">
                  <p className="text-red-800 dark:text-red-200 font-bold leading-relaxed italic">All assets must be received by carrier within <span className="underline decoration-4 font-black">2 BUSINESS DAYS</span>. No exceptions.</p>
                </div>
                <div className="flex items-start gap-3 p-6 bg-muted rounded-none">
                  <Checkbox id="ship-agree" checked={formData.agreedToShipping} onCheckedChange={v => setFormData({...formData, agreedToShipping: !!v})} className="mt-1" />
                  <Label htmlFor="ship-agree" className="text-xs font-black uppercase cursor-pointer leading-tight">I certify adherence to the mandatory 2-day delivery standard.</Label>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button onClick={() => setStep(3)} variant="outline" className="h-16 px-8 rounded-none font-black uppercase text-[10px] tracking-widest border-2">Back</Button>
              <Button onClick={() => setStep(5)} disabled={!formData.agreedToShipping} className="flex-1 h-16 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none shadow-xl">Configure Node <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <Card className="border-none shadow-2xl rounded-none overflow-hidden bg-card">
              <CardHeader className="bg-zinc-950 text-white p-8 rounded-none">
                <CardTitle className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic tracking-tight"><Target className="w-6 h-6 text-accent" /> Store Details</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-10 rounded-none">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username (Locked)</Label>
                    <div className="h-14 flex items-center px-4 rounded-none bg-muted/50 border-2 border-dashed font-black text-accent uppercase text-sm italic">
                      @{profile?.username}
                    </div>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tight">Your store name is permanently locked to your username.</p>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Tagline</Label><Input placeholder="e.g. Elite TCG & Premium" className="h-14 rounded-none border-2 font-bold bg-background text-foreground" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specialty Sector</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="h-14 rounded-none border-2 font-black bg-background text-foreground"><SelectValue placeholder="Select Niche" /></SelectTrigger>
                      <SelectContent className="font-bold">{CATEGORIES.map(c => <SelectItem key={c} value={c} className="uppercase text-[10px] tracking-widest font-black">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="pt-8 border-t space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Return Address</Label>
                  <Input placeholder="Street Address" className="h-12 rounded-none border-2 bg-background text-foreground" value={formData.address.line1} onChange={e => setFormData({...formData, address: {...formData.address, line1: e.target.value}})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="City" className="h-12 rounded-none border-2 bg-background text-foreground" value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} />
                    <Select value={formData.address.state} onValueChange={v => setFormData({...formData, address: {...formData.address, state: v}})}>
                      <SelectTrigger className="h-12 rounded-none border-2 bg-background text-foreground font-bold"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent className="font-bold">
                        {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => (
                          <SelectItem key={s} value={s} className="uppercase text-[10px] tracking-widest font-black">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Zip" className="h-12 rounded-none border-2 bg-background text-foreground" value={formData.address.zip} onChange={e => setFormData({...formData, address: {...formData.address, zip: e.target.value}})} />
                  </div>
                </div>
                <div className="pt-8 border-t space-y-6">
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-none">
                    <Checkbox id="legal-agree" checked={formData.agreedToLegal} onCheckedChange={(checked) => setFormData({...formData, agreedToLegal: !!checked})} />
                    <Label htmlFor="legal-agree" className="text-[10px] font-black uppercase leading-tight cursor-pointer">I certify legal authority to operate via Stripe Connect.</Label>
                  </div>
                  <Button onClick={handleConnectStripe} disabled={isConnectingStripe || !formData.tagline || !formData.category || !formData.agreedToLegal || !formData.address.line1} className="w-full h-16 rounded-none font-black bg-[#635BFF] text-white shadow-xl transition-all active:scale-95 uppercase text-[10px] tracking-widest">
                    {isConnectingStripe ? <Loader2 className="animate-spin w-5 h-5" /> : "Sync Payment Terminal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <Card className="border-none shadow-2xl rounded-none overflow-hidden bg-card">
              <div className="p-12 text-center space-y-10">
                {stripeStatus === 'pending' ? (
                  <div className="space-y-8">
                    <div className="w-24 h-24 bg-muted rounded-none flex items-center justify-center mx-auto border-2 border-dashed"><ShieldAlert className="w-12 h-12 text-zinc-400" /></div>
                    <h2 className="text-3xl font-headline font-black uppercase italic text-primary">Identity Check</h2>
                    <Button onClick={checkStripeStatus} disabled={isVerifying} className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none shadow-xl">
                      {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity Connection"}
                    </Button>
                  </div>
                ) : stripeStatus === 'complete' ? (
                  <div className="space-y-10 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-500 rounded-none flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20"><ShieldCheck className="w-12 h-12 text-white" /></div>
                    <h2 className="text-4xl font-headline font-black uppercase italic tracking-tighter text-primary">AUTHORIZED_NODE</h2>
                    <Button onClick={() => setStep(7)} className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none shadow-xl">Finalize Deployment <ArrowRight className="ml-2 w-5 h-5" /></Button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in shake-in">
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
                    <p className="text-muted-foreground font-medium italic text-sm">{stripeError}</p>
                    <Button onClick={checkStripeStatus} variant="outline" className="h-14 rounded-none font-black uppercase text-[10px] tracking-widest border-2">Retry Handshake</Button>
                    <Button onClick={handleFinalLaunch} variant="default" className="h-14 rounded-none font-black uppercase text-[10px] tracking-widest w-full">Try Finalize Again</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {step === 7 && (
          <div className="animate-in fade-in zoom-in duration-700 space-y-12">
            <header className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto mb-8"><Rocket className="w-12 h-12 text-accent mx-auto" /></div>
              <h1 className="text-4xl md:text-6xl font-headline font-black uppercase italic tracking-tighter leading-none">Deployment</h1>
              <p className="text-muted-foreground font-medium italic">Identity locked. Authorize node activation.</p>
            </header>
            <div className="bg-zinc-950 p-10 rounded-none shadow-2xl text-white space-y-10 relative overflow-hidden">
              <div className="absolute inset-0 hardware-grid-overlay opacity-10" />
              <Button onClick={handleFinalLaunch} disabled={isSubmitting} className="w-full h-24 bg-primary text-primary-foreground hover:bg-primary/90 font-black text-3xl rounded-none shadow-2xl uppercase italic tracking-tighter active:scale-95 group relative z-10">
                {isSubmitting ? <Loader2 className="animate-spin w-10 h-10" /> : "Deploy Storefront"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SellerOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
