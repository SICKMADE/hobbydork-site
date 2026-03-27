'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/mock-data';
import { 
  Loader2, 
  ArrowRight,
  Zap,
  CheckCircle2,
  Rocket,
  ShieldAlert,
  Activity,
  Terminal,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import { cn } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

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

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    tagline: '',
    category: '',
    agreedToShipping: false,
    address: {
      line1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });

  // Persistence Protocol
  useEffect(() => {
    const saved = localStorage.getItem('hd_seller_manifest_draft');
    if (saved) {
      try { setFormData(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hd_seller_manifest_draft', JSON.stringify(formData));
  }, [formData]);

  // Handle Stripe Redirect Handshake
  useEffect(() => {
    const isStripeReturn = window.location.search.includes('stripe') || window.location.search.includes('onboarding=complete');
    if (isStripeReturn) {
      setStep(6);
      checkStripeStatus();
    } else if (searchParams?.get('step')) {
      setStep(parseInt(searchParams.get('step')!));
    }
  }, [searchParams, profile]);

  const checkStripeStatus = async () => {
    if (!user || !functions || !profile?.stripeAccountId) {
      setStripeStatus('incomplete');
      return;
    }
    setIsVerifying(true);
    try {
      const getAccount = httpsCallable(functions, 'getStripeAccount');
      const result: any = await getAccount({ accountId: profile.stripeAccountId });
      if (result.data?.details_submitted) {
        setStripeStatus('complete');
      } else {
        setStripeStatus('incomplete');
      }
    } catch (e: any) {
      setStripeStatus('incomplete');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user || !functions) return;
    setIsConnectingStripe(true);
    try {
      const origin = window.location.origin;
      const callable = httpsCallable(functions, 'createStripeOnboarding');
      const result = await callable({ appBaseUrl: origin });
      const data = result.data as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Could not generate Stripe link.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Connection Error', description: getFriendlyErrorMessage(e) });
      setIsConnectingStripe(false);
    }
  };

  const handleFinalLaunch = async () => {
    if (!functions || !user || !db || !profile) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        tagline: formData.tagline,
        category: formData.category,
        shippingAddress: formData.address,
        isSeller: true,
        updatedAt: serverTimestamp()
      });

      const finalize = httpsCallable(functions, 'finalizeSeller');
      await finalize({});
      
      localStorage.removeItem('hd_seller_manifest_draft');
      toast({ title: "Shop Deployed!", description: "Your storefront is now live." });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Launch Failed", description: getFriendlyErrorMessage(e) });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-12 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {step} of 7</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">
              {step === 5 ? 'Stripe Gateway' : step === 6 ? 'Business Manifest' : 'Seller Onboarding'}
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-primary transition-all duration-700",
                `w-[${(step / 7) * 100}%]`
              )}
            />
          </div>
        </div>

        {step <= 4 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="p-10 text-center space-y-8 rounded-[3rem] border-4 shadow-2xl border-zinc-100">
              <h2 className="text-4xl font-headline font-black uppercase italic tracking-tighter leading-none">
                {step === 1 && 'Sell on hobbydork'}
                {step === 2 && 'Engage Collectors'}
                {step === 3 && 'Launch Prize Drops'}
                {step === 4 && 'Shipping Standards'}
              </h2>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed italic">
                {step === 1 && 'Open your secure shop and start selling to verified collectors.'}
                {step === 2 && 'Every shop gets a social feed to post updates and chat with followers.'}
                {step === 3 && 'Reward your community with prize drops. Followers enter automatically.'}
                {step === 4 && 'All sellers must ship within 2 business days. It’s the platform rule.'}
              </p>
              {step === 4 && (
                <div className="flex items-start gap-4 p-8 bg-red-50 rounded-3xl text-left border-2 border-red-100 shadow-inner">
                  <Checkbox id="ship-agree" checked={formData.agreedToShipping} onCheckedChange={v => setFormData({...formData, agreedToShipping: !!v})} className="mt-1 h-6 w-6" />
                  <div className="space-y-1">
                    <Label htmlFor="ship-agree" className="text-sm font-black uppercase tracking-tight text-red-900 cursor-pointer">I authorize 48-hour compliance.</Label>
                    <p className="text-[10px] text-red-600/60 font-bold uppercase italic">Failure to ship within 2 days resets seller hearts.</p>
                  </div>
                </div>
              )}
              <Button 
                onClick={() => setStep(step + 1)} 
                disabled={step === 4 && !formData.agreedToShipping}
                className="w-full h-20 bg-primary text-white font-black uppercase rounded-2xl text-xl shadow-xl active:scale-95 transition-all group"
              >
                Accept & Continue <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Card>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <Card className="p-12 text-center space-y-10 bg-zinc-950 text-white rounded-[3.5rem] shadow-2xl border-none relative overflow-hidden">
              <div className="absolute inset-0 hardware-grid-overlay opacity-[0.05]" />
              <div className="relative z-10 space-y-8">
                <div className="bg-accent text-white w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(220,38,38,0.4)]">
                  <Activity className="w-12 h-12 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-headline font-black uppercase italic tracking-tighter">Stripe Identity</h2>
                  <p className="text-zinc-400 text-base font-medium leading-relaxed italic max-w-sm mx-auto">Authorization is required to handle high-stakes transactions and secure seller payouts.</p>
                </div>
                <Button 
                  onClick={handleConnectStripe} 
                  disabled={isConnectingStripe}
                  className="w-full h-24 bg-[#635BFF] hover:bg-[#5851E0] text-white font-black uppercase rounded-[2rem] shadow-2xl transition-all text-xl active:scale-95"
                >
                  {isConnectingStripe ? <Loader2 className="animate-spin w-8 h-8" /> : "Initiate Stripe Sync"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {step === 6 && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <Card className="p-10 space-y-12 rounded-[3rem] shadow-2xl border-4 border-zinc-100 bg-card">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
                  <Terminal className="w-3 h-3" /> Step 6: Manifest
                </div>
                <h2 className="text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tighter">Shop Manifest</h2>
                <p className="text-sm text-muted-foreground font-medium italic">Identity verified. Finalize your storefront deployment parameters below.</p>
              </header>

              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Shop Tagline</Label>
                  <Input placeholder="e.g. Rare TCG Specialists" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="h-16 rounded-2xl border-2 font-black text-xl focus-visible:ring-accent shadow-inner" />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Primary Niche</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger className="h-16 rounded-2xl border-2 font-black text-xl focus-visible:ring-accent shadow-inner"><SelectValue placeholder="Target Category" /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 shadow-2xl">{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-black uppercase text-xs tracking-widest py-3">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <div className="pt-8 border-t border-dashed space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-4 h-4 text-accent" />
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">ORIGIN_LOGISTICS</Label>
                  </div>
                  <div className="space-y-4">
                    <Input placeholder="Origin Street Address" value={formData.address.line1} onChange={e => setFormData({...formData, address: {...formData.address, line1: e.target.value}})} className="h-16 border-2 rounded-2xl font-bold text-lg shadow-inner" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="City" value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} className="h-16 border-2 rounded-2xl font-bold text-lg shadow-inner" />
                      <Input placeholder="Zip" value={formData.address.zip} onChange={e => setFormData({...formData, address: {...formData.address, zip: e.target.value}})} className="h-16 border-2 rounded-2xl font-bold text-lg shadow-inner" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t space-y-6">
                <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    {stripeStatus === 'complete' ? (
                      <div className="bg-green-500/10 p-2 rounded-xl"><CheckCircle2 className="text-green-600 w-6 h-6" /></div>
                    ) : (
                      <div className="bg-accent/10 p-2 rounded-xl"><Loader2 className="animate-spin text-accent w-6 h-6" /></div>
                    )}
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">STRIPE_IDENTITY</span>
                  </div>
                  <Badge variant={stripeStatus === 'complete' ? 'default' : 'outline'} className={cn(
                    "uppercase text-[9px] font-black tracking-widest px-4 h-8 rounded-full shadow-lg",
                    stripeStatus === 'complete' ? "bg-green-600 text-white" : "animate-pulse border-accent text-accent"
                  )}>
                    {stripeStatus === 'complete' ? 'AUTHORIZED' : 'SYNC_PENDING'}
                  </Badge>
                </div>
                
                <Button 
                  onClick={() => setStep(7)} 
                  disabled={!formData.tagline || !formData.category || !formData.address.line1 || stripeStatus !== 'complete'}
                  className="w-full h-24 bg-primary text-white font-black uppercase rounded-[2rem] shadow-2xl text-2xl active:scale-95 transition-all group"
                >
                  Deploy Shop Node <ArrowRight className="ml-2 w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        {step === 7 && (
          <div className="animate-in zoom-in duration-700 space-y-12 text-center py-16">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent blur-[60px] opacity-20 animate-pulse" />
              <div className="relative w-32 h-32 bg-accent rounded-[3.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <Rocket className="w-16 h-16 text-white animate-bounce" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-none">All Green.</h1>
              <p className="text-muted-foreground text-xl font-medium italic max-w-md mx-auto">Manifest locked. Identity confirmed. Click below to activate your storefront node.</p>
            </div>
            <Button 
              onClick={handleFinalLaunch} 
              disabled={isSubmitting} 
              className="w-full h-32 bg-primary text-white hover:bg-primary/90 font-black text-4xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] uppercase italic tracking-tighter active:scale-95 transition-all border-b-[12px] border-zinc-950"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-16 h-16" /> : "ACTIVATE STORE"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SellerOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent w-12 h-12" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
