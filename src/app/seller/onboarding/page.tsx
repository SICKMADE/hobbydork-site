'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/mock-data';
import { 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Lock,
  CreditCard,
  AlertCircle,
  Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import Link from 'next/link';

type Step = 1 | 2 | 3 | 4 | 5;

export default function SellerOnboarding() {
  const [step, setStep] = useState<Step>(1);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // Security Rules Alignment: Creating storefront requires isVerified()
  const isVerified = !!(profile?.emailVerified && profile?.status === 'ACTIVE');

  const [formData, setFormData] = useState({
    tagline: '',
    category: '',
    description: '',
    agreedToTerms: false,
    agreedToPaymentRules: false,
    agreedToAuthenticity: false,
    agreedToShippingStandards: false,
    stripeVerified: false,
  });

  const nextStep = () => setStep((s) => (s + 1) as Step);
  const prevStep = () => setStep((s) => (s - 1) as Step);

  useEffect(() => {
    if (!profile) return;
    const alreadyConnected = Boolean(
      profile?.stripeOnboarded ||
      (profile?.stripeAccountId && (profile?.sellerStatus === 'APPROVED' || profile?.isSeller))
    );
    if (alreadyConnected) {
      setFormData((prev) => ({ ...prev, stripeVerified: true }));
    }
  }, [profile?.stripeOnboarded, profile?.stripeAccountId, profile?.sellerStatus, profile?.isSeller]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestedStep = new URLSearchParams(window.location.search).get('step');
    if (requestedStep === '5') {
      setStep(5);
      setFormData((prev) => ({ ...prev, stripeVerified: true }));
    }
  }, []);

  const handleConnectStripe = async () => {
    if (!user || !functions) return;
    setIsConnectingStripe(true);
    try {
      const callable = httpsCallable(functions, 'createStripeOnboarding');
      const result = await callable({ appBaseUrl: "https://hobbydork.com" });
      const data = result.data as { url?: string };
      if (!data?.url) {
        throw new Error('Missing Stripe onboarding URL');
      }
      window.location.href = data.url;
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Stripe Connection Failed',
        description: e?.message || 'Could not start Stripe onboarding. Please try again.',
      });
      setIsConnectingStripe(false);
    }
  };

  const handleComplete = async () => {
    if (!db || !user || !profile) return;
    setIsSubmitting(true);

    try {
      const finalizeSeller = httpsCallable(functions, 'finalizeSeller');
      const finalized = await finalizeSeller({});
      const finalizedData = finalized.data as { storeId?: string };
      const storeId = finalizedData?.storeId || profile.username || user.uid;

      const storeRef = doc(db, 'storefronts', storeId);
      await setDoc(storeRef, {
        ownerUid: user.uid,
        username: profile.username,
        tagline: formData.tagline,
        description: formData.description,
        category: formData.category,
        theme: 'Default',
        totalSales: 0,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      toast({ 
        title: "Shop Launched!", 
        description: "Welcome to the verified dealer circle." 
      });
      router.push('/dashboard');
    } catch (e) {
      toast({ variant: 'destructive', title: "Activation Failed" });
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Identity', icon: Lock },
    { id: 2, name: 'Specialty', icon: Sparkles },
    { id: 3, name: 'Trust', icon: ShieldCheck },
    { id: 4, name: 'Payments', icon: CreditCard },
    { id: 5, name: 'Launch', icon: CheckCircle2 },
  ];

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  // Identity Gate: Must follow rules for isVerified() before storefront creation
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-32 text-center max-w-lg space-y-8">
          <div className="w-20 h-20 bg-accent/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Identity Required</h1>
          <p className="text-muted-foreground font-medium">To maintain a secure marketplace, storefronts can only be established by active members with verified email addresses.</p>
          <Button asChild className="h-14 px-10 rounded-xl font-black uppercase bg-accent text-accent-foreground shadow-xl">
            <Link href="/verify-email">Verify Email Now</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <header className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <Badge variant="outline" className="px-6 py-1.5 rounded-full text-accent border-accent uppercase font-black text-[9px] md:text-[10px] tracking-widest">
            Dealer Onboarding
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-headline font-black uppercase italic tracking-tighter text-primary leading-tight">
            Become a Seller
          </h1>
          
          <div className="flex items-center justify-center gap-0 mt-8 md:mt-12 overflow-x-auto pb-4 scrollbar-hide">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center shrink-0">
                <div className={cn(
                  "w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-xl", 
                  step >= s.id ? "bg-accent border-accent text-white" : "bg-white border-zinc-200 text-zinc-400"
                )}>
                  <s.icon className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                {idx !== steps.length - 1 && (
                  <div className={cn("w-6 md:w-12 h-[2px]", step > s.id ? "bg-accent" : "bg-zinc-200")} />
                )}
              </div>
            ))}
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-card border-b p-5 sm:p-6 md:p-10">
                <CardTitle className="text-lg sm:text-xl md:text-3xl font-black italic uppercase tracking-tight">Step 1: Identity</CardTitle>
                <CardDescription className="text-muted-foreground text-sm md:text-base font-medium">Branding your professional storefront.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 md:p-10 space-y-6 md:space-y-8">
                <div className="bg-zinc-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-dashed border-zinc-200">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Shop Handle</Label>
                  <p className="text-2xl md:text-4xl font-headline font-black text-primary mt-2 italic">@{profile?.username || 'Collector'}</p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="tagline" className="text-xs font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">Store Tagline</Label>
                  <Input 
                    id="tagline" 
                    placeholder="Rare collectibles curated with passion" 
                    className="h-12 md:h-16 rounded-xl md:rounded-2xl border-2 font-bold text-base md:text-lg" 
                    value={formData.tagline} 
                    onChange={(e) => setFormData({...formData, tagline: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-zinc-50 flex justify-end">
                <Button 
                  onClick={nextStep} 
                  disabled={!formData.tagline} 
                  className="bg-accent text-accent-foreground rounded-xl md:rounded-2xl px-8 md:px-12 h-12 md:h-14 font-black text-base md:text-lg gap-2 shadow-xl shadow-accent/20 active:scale-95 transition-transform w-full md:w-auto"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-card border-b p-6 md:p-10">
                <CardTitle className="text-xl md:text-3xl font-black italic uppercase tracking-tight">Step 2: Specialty</CardTitle>
                <CardDescription className="text-muted-foreground text-sm md:text-base font-medium">What is your niche?</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">Primary Category</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl border-2 font-bold text-base md:text-lg">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-[0.2em] ml-1 text-muted-foreground">Store Bio</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Your journey as a collector..." 
                    className="min-h-[120px] md:min-h-[150px] rounded-xl md:rounded-2xl border-2 font-medium text-base p-4 md:p-6" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-zinc-50 flex justify-between gap-4">
                <Button variant="ghost" onClick={prevStep} className="font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-zinc-200 h-12 md:h-14">Back</Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!formData.category} 
                  className="bg-accent text-accent-foreground rounded-xl md:rounded-2xl px-8 md:px-12 h-12 md:h-14 font-black text-base md:text-lg gap-2 shadow-xl shadow-accent/20 active:scale-95 transition-transform flex-1 md:flex-none"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-card border-b p-6 md:p-10">
                <CardTitle className="text-xl md:text-3xl font-black italic uppercase tracking-tight">Step 3: Trust</CardTitle>
                <CardDescription className="text-muted-foreground text-sm md:text-base font-medium">What makes HobbyDork different.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-3 md:space-y-4">
                <div className="bg-gradient-to-r from-red-500/10 to-accent/10 p-4 md:p-6 rounded-2xl border-2 border-red-500/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-sm md:text-base uppercase tracking-tight mb-2 text-red-900 dark:text-red-100">⚠️ Built on Fast, Honest Shipping</h4>
                      <p className="text-xs md:text-sm font-bold text-red-800/80 dark:text-red-200/80 leading-relaxed mb-3">
                        HobbyDork is different. We hold sellers to strict shipping standards that are ENFORCED.
                      </p>
                      <ul className="text-xs md:text-sm font-bold text-red-900 dark:text-red-100 space-y-2 list-disc pl-5">
                        <li>Your package must be <span className="underline">received by carrier</span> within <span className="font-black">2 business days</span> of payment (weekends & holidays excluded)</li>
                        <li>If tracking doesn't show carrier acceptance within 2 business days, buyers can cancel with one click</li>
                        <li>You lose the sale AND receive penalties: lower tier, higher fees, damaged reputation</li>
                        <li>Just creating a label is NOT enough - the package must actually be scanned by USPS/UPS/FedEx</li>
                      </ul>
                      <div className="bg-red-900/10 dark:bg-red-100/10 border-2 border-red-600 rounded-lg p-3 md:p-4 mt-4">
                        <p className="text-xs md:text-sm font-black text-red-900 dark:text-red-100 leading-relaxed">
                          🚨 IMPORTANT: If you cannot commit to shipping within 2 business days, DO NOT list the item for sale. Only list items you can ship immediately. Going on vacation? Traveling? Don't have time to get to the post office? Then don't list items until you're ready to fulfill orders fast.
                        </p>
                      </div>
                      <p className="text-xs md:text-sm font-black text-red-900 dark:text-red-100 mt-3">
                        If you can't ship fast consistently, this platform is not for you.
                      </p>
                    </div>
                  </div>
                </div>
                {[
                  { id: 'terms', label: 'Agree to Community Terms', field: 'agreedToTerms' },
                  { id: 'payment', label: 'Use Stripe for transactions', field: 'agreedToPaymentRules' },
                  { id: 'auth', label: 'Guarantee authenticity', field: 'agreedToAuthenticity' },
                  { id: 'shipping', label: 'I will get packages RECEIVED by carrier within 2 business days or buyers can cancel', field: 'agreedToShippingStandards', highlight: true },
                ].map((item) => (
                  <div key={item.id} className={`flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-3xl ${item.highlight ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500/30' : 'bg-zinc-50 border-2 border-dashed border-zinc-200'} hover:bg-opacity-80 transition-colors`}>
                    <Checkbox 
                      id={item.id} 
                      checked={(formData as any)[item.field]} 
                      onCheckedChange={(checked) => setFormData({...formData, [item.field]: !!checked})} 
                      className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl border-zinc-300" 
                    />
                    <Label htmlFor={item.id} className={`text-xs md:text-sm font-black cursor-pointer uppercase tracking-tight leading-none ${item.highlight ? 'text-red-900 dark:text-red-100' : ''}`}>{item.label}</Label>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-zinc-50 flex justify-between gap-4">
                <Button variant="ghost" onClick={prevStep} className="font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-zinc-200 h-12 md:h-14">Back</Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!formData.agreedToTerms || !formData.agreedToPaymentRules || !formData.agreedToAuthenticity || !formData.agreedToShippingStandards} 
                  className="bg-accent text-accent-foreground rounded-xl md:rounded-2xl px-8 md:px-12 h-12 md:h-14 font-black text-base md:text-lg gap-2 shadow-xl shadow-accent/20 active:scale-95 transition-transform flex-1 md:flex-none"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-card border-b p-6 md:p-10">
                <CardTitle className="text-xl md:text-3xl font-black italic uppercase tracking-tight">Step 4: Payments</CardTitle>
                <CardDescription className="text-muted-foreground text-sm md:text-base font-medium">Connect Stripe.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-16 text-center space-y-6 md:space-y-8">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-accent/10 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-accent/20">
                  <CreditCard className="w-8 h-8 md:w-12 md:h-12 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter">Stripe Connect</h3>
                  <p className="text-muted-foreground text-xs md:text-sm font-bold max-w-sm mx-auto">Transactions secured via escrow.</p>
                </div>
                <Button 
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                  className={cn(
                    "w-full h-14 md:h-20 rounded-xl md:rounded-2xl font-black text-lg md:text-xl gap-4 transition-all shadow-xl active:scale-95", 
                    formData.stripeVerified ? "bg-green-600 hover:bg-green-700 text-white" : "bg-[#635BFF] hover:bg-[#5851E0] text-white"
                  )}
                >
                  {isConnectingStripe ? (
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
                  ) : formData.stripeVerified ? (
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
                  ) : (
                    <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
                  )}
                  {isConnectingStripe ? "Opening Stripe..." : formData.stripeVerified ? "Account Connected" : "Connect Stripe"}
                </Button>
              </CardContent>
              <CardFooter className="p-6 md:p-10 bg-zinc-50 flex justify-between gap-4">
                <Button variant="ghost" onClick={prevStep} className="font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-zinc-200 h-12 md:h-14">Back</Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!formData.stripeVerified || isConnectingStripe}
                  className="bg-accent text-accent-foreground rounded-xl md:rounded-2xl px-8 md:px-12 h-12 md:h-14 font-black text-base md:text-lg gap-2 shadow-xl shadow-accent/20 active:scale-95 transition-transform flex-1 md:flex-none"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 5 && (
            <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[3rem] overflow-hidden text-center animate-in zoom-in duration-500">
              <CardHeader className="bg-[#1e2128] text-white p-8 md:p-16 pb-8 md:pb-12">
                <div className="relative w-16 h-16 md:w-24 md:h-24 bg-accent rounded-xl md:rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl mb-6 md:mb-8">
                  <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-white" />
                </div>
                <CardTitle className="text-3xl md:text-5xl font-headline font-black italic uppercase tracking-tighter leading-tight md:leading-none">
                  Ready for Launch
                </CardTitle>
                <CardDescription className="text-white/50 text-base md:text-xl mt-2 md:mt-4 font-medium italic">
                  "The community is waiting."
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-12 md:px-16 space-y-6 md:space-y-8">
                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-bold max-w-md mx-auto">
                  Your identity is secured. Reach 500k collectors instantly.
                </p>
                
                <div className="bg-red-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-dashed border-red-200 flex gap-4 text-left">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                  <p className="text-[10px] md:text-xs font-black text-red-700 uppercase leading-relaxed">
                    By launching, you acknowledge responsibility for maintaining authenticity standards.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-8 md:p-16 pt-0 flex flex-col gap-4 md:gap-6">
                <Button 
                  onClick={handleComplete} 
                  disabled={isSubmitting} 
                  className="w-full h-16 md:h-24 bg-accent hover:bg-accent/90 text-white rounded-2xl md:rounded-3xl font-headline font-black text-xl md:text-3xl shadow-[0_15px_40px_rgba(255,0,0,0.2)] uppercase italic tracking-tighter transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : "Open My Shop Now"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={prevStep} 
                  disabled={isSubmitting} 
                  className="font-black uppercase text-[10px] md:text-xs tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors h-12"
                >
                  Review Info
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
