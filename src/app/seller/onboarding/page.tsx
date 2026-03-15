
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
  Loader2, 
  CreditCard, 
  Mail, 
  Zap, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import Link from 'next/link';

export default function SellerOnboarding() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    tagline: '',
    category: '',
    description: '',
    agreedToShipping: false,
    stripeConnected: false,
  });

  useEffect(() => {
    if (profile?.stripeOnboarded || profile?.isSeller) {
      setFormData(prev => ({ ...prev, stripeConnected: true }));
    }
    if (profile?.isSeller && profile?.sellerStatus === 'APPROVED') {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  const handleConnectStripe = async () => {
    if (!user || !functions) return;
    setIsConnectingStripe(true);
    try {
      const callable = httpsCallable(functions, 'createStripeOnboarding');
      const result = await callable({ appBaseUrl: window.location.origin });
      const data = result.data as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Missing Stripe URL');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Stripe Error', description: e.message });
      setIsConnectingStripe(false);
    }
  };

  const handleComplete = async () => {
    if (!db || !user || !profile) return;
    setIsSubmitting(true);

    try {
      // Direct update for faster onboarding
      await updateDoc(doc(db, 'users', user.uid), {
        isSeller: true,
        sellerStatus: 'APPROVED', // Instant approval for this phase
        tagline: formData.tagline,
        category: formData.category,
        updatedAt: serverTimestamp(),
      });

      // Initialize storefront
      const storeId = profile.username || user.uid;
      await setDoc(doc(db, 'storefronts', storeId), {
        id: storeId,
        ownerUid: user.uid,
        username: profile.username || 'Collector',
        tagline: formData.tagline,
        category: formData.category,
        status: 'ACTIVE',
        totalSales: 0,
        isSpotlighted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Shop is Live!", description: "Welcome to the dealer network." });
      router.push('/dashboard');
    } catch (e) {
      toast({ variant: 'destructive', title: "Setup Failed" });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <header className="text-center mb-12 space-y-4">
          <Badge className="bg-accent text-white uppercase font-black px-4 py-1">Dealer Onboarding</Badge>
          <h1 className="text-4xl font-headline font-black italic uppercase tracking-tighter">Open Your Shop</h1>
          <p className="text-muted-foreground font-medium">Verified status is required to list inventory.</p>
        </header>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-zinc-950 text-white p-8">
            <CardTitle className="text-2xl font-black italic uppercase flex items-center gap-3">
              <Zap className="w-6 h-6 text-accent" /> Shop Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Store Tagline</Label>
                <Input 
                  placeholder="e.g. Your source for rare vintage cards" 
                  className="h-14 rounded-xl border-2 font-bold" 
                  value={formData.tagline} 
                  onChange={e => setFormData({...formData, tagline: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Primary Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="Select Niche" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-red-900 leading-relaxed">
                  <span className="font-black">MANDATORY:</span> You must ship orders within 2 business days. Late shipments result in automatic refunds and account penalties.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="ship-agree" checked={formData.agreedToShipping} onCheckedChange={v => setFormData({...formData, agreedToShipping: !!v})} />
                <Label htmlFor="ship-agree" className="text-[10px] font-black uppercase cursor-pointer">I agree to the 2-day shipping protocol</Label>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed">
              <Label className="text-[10px] font-black uppercase tracking-widest">Payment Settlement</Label>
              <Button 
                onClick={handleConnectStripe} 
                disabled={isConnectingStripe || formData.stripeConnected}
                className={cn("w-full h-14 rounded-xl font-black gap-2 transition-all", formData.stripeConnected ? "bg-green-600" : "bg-[#635BFF] hover:bg-[#5851E0] text-white")}
              >
                {isConnectingStripe ? <Loader2 className="animate-spin" /> : formData.stripeConnected ? <CheckCircle2 /> : <CreditCard />}
                {formData.stripeConnected ? "Stripe Connected" : "Connect Stripe Account"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-8 bg-zinc-50 border-t">
            <Button 
              onClick={handleComplete} 
              disabled={isSubmitting || !formData.stripeConnected || !formData.agreedToShipping || !formData.tagline}
              className="w-full h-16 bg-accent hover:bg-accent/90 text-white font-black text-xl rounded-2xl shadow-xl uppercase italic tracking-tighter"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Launch My Storefront"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
