'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PREMIUM_PRODUCTS, PremiumProduct } from '@/lib/mock-data';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  ArrowRight, 
  Building2, 
  BookOpen, 
  Monitor, 
  Loader2,
  CreditCard,
  Lock,
  Package,
  Radio,
  Ghost,
  Terminal,
  Gamepad2,
  Brush
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * ThemePreview Component
 */
function ThemePreview({ themeName }: { themeName: string }) {
  const isNeonSyndicate = themeName === 'Neon Syndicate Theme';
  const isComicBook = themeName === 'Comic Book Theme';
  const isUrban = themeName === 'Urban Theme';
  const isGameTheme = themeName === 'NES ORIGINAL THEME';
  const isGlitchProtocol = themeName === 'Glitch Protocol Theme';
  const isVoidShard = themeName === 'Void Shard Theme';
  const isHacked = themeName === 'HACKED THEME';

  return (
    <div className={cn(
      "w-full aspect-[16/10] rounded-xl shadow-inner flex items-center justify-center p-4 transition-all duration-500 overflow-hidden relative border",
      isNeonSyndicate ? 'bg-zinc-950 border-cyan-500/30' : 
      isComicBook ? 'bg-white border-[4px] border-black rounded-none comic-dots' : 
      isUrban ? "bg-[url('/brick-wall.png')] bg-repeat bg-[size:100px] border-2 border-slate-300" : 
      isGameTheme ? 'bg-[#cccccc] border-black border-4' :
      isGlitchProtocol ? 'bg-zinc-950 border-2 border-white/10' :
      isVoidShard ? 'bg-zinc-950 border-2 border-violet-500/30 overflow-hidden' :
      isHacked ? 'bg-black border-2 border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.1)]' :
      'bg-zinc-50 border-zinc-100'
    )}>
       {isGameTheme && (
         <div className="absolute top-2 left-2 flex gap-1 opacity-40">
           <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
           <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
         </div>
       )}
       {isGlitchProtocol && (
         <>
           <div className="absolute inset-0 hardware-grid-overlay opacity-10" />
           <div className="absolute inset-0 animate-noise opacity-5" />
         </>
       )}
       {isHacked && (
         <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none font-mono text-[6px] overflow-hidden leading-none text-[#00FF41]">
           {Array.from({ length: 20 }).map((_, i) => (
             <div key={i} className="animate-binary-scroll">{Math.random().toString(2).substring(2, 50)}</div>
           ))}
         </div>
       )}
       <div className="w-full space-y-3 relative z-10">
          <div className={cn("h-4 rounded w-3/4", 
            isNeonSyndicate ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]' : 
            isComicBook ? 'bg-yellow-400 border-2 border-black' : 
            isGameTheme ? 'bg-red-600 shadow-[0_4px_0_0_#a00000] rounded-full w-8 h-8 mx-auto' : 
            isGlitchProtocol ? 'bg-white animate-rgb' : 
            isVoidShard ? 'bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-void' :
            isHacked ? 'bg-[#00FF41] shadow-[0_0_15px_#00FF41]' :
            'bg-primary'
          )} />
          
          <div className="grid grid-cols-2 gap-2 mt-4">
             {[1, 2].map((i) => (
               <div key={i} className={cn(
                 "h-16 rounded overflow-hidden flex flex-col", 
                 isComicBook ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : 
                 isGameTheme ? "bg-[#707070] border-2 border-black rounded-none shadow-[4px_4px_0_0_#000]" : 
                 isUrban ? "bg-black border-t border-r-2 border-b-2 border-l border-white outline outline-1 outline-white outline-offset-2" : 
                 isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20" : 
                 isGlitchProtocol ? "bg-black border border-white/5" : 
                 isHacked ? "bg-black border border-[#00FF41]/30 rounded-none" :
                 'bg-white border'
               )}>
                 <div className="h-8 w-full relative bg-muted/20 flex items-center justify-center">
                    <Package className="w-4 h-4 opacity-10" />
                 </div>
                 <div className="p-1 space-y-1">
                   <div className={cn("h-1 w-2/3 rounded", isHacked ? "bg-[#00FF41]/20" : "bg-muted-foreground/20")} />
                   <div className={cn("h-1 w-1/3 rounded", isHacked ? "bg-[#00FF41]" : "bg-accent")} />
                 </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}

export default function HobbydorkStore() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<PremiumProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactInfo, setContactInfo] = useState('');

  const handleOpenCheckout = (product: PremiumProduct) => {
    if (!user) {
      toast({ variant: 'destructive', title: "Auth Required", description: "Sign in to upgrade your business." });
      return;
    }
    setSelectedProduct(product);
    setContactInfo('');
    setIsDialogOpen(true);
  };

  const handleStripeCheckout = async () => {
    if (!selectedProduct || !user) return;
    
    if (selectedProduct.id === 'p10' && !contactInfo.trim()) {
      toast({ variant: 'destructive', title: "Info Required", description: "Please provide contact info so we can start your design." });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ name: selectedProduct.name, price: selectedProduct.price, quantity: 1 }],
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: window.location.href,
          metadata: { 
            productId: selectedProduct.id, 
            buyerId: user.uid,
            contactInfo: contactInfo.trim() || 'N/A'
          }
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Stripe Error" });
      setIsProcessing(false);
    }
  };

  const getIcon = (productName: string, category: string) => {
    if (productName.includes('Weekly Spotlight')) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (productName.includes('Custom 1-of-1')) return <Brush className="w-6 h-6 text-pink-500" />;
    if (productName.includes('Comic')) return <BookOpen className="w-6 h-6 text-orange-500" />;
    if (productName.includes('Neon Syndicate')) return <Monitor className="w-6 h-6 text-cyan-400" />;
    if (productName.includes('Urban')) return <Building2 className="w-6 h-6 text-blue-500" />;
    if (productName.includes('NES ORIGINAL')) return <Gamepad2 className="w-6 h-6 text-red-600" />;
    if (productName.includes('Glitch Protocol')) return <Radio className="w-6 h-6 text-white animate-pulse" />;
    if (productName.includes('Void Shard')) return <Ghost className="w-6 h-6 text-violet-400 animate-void" />;
    if (productName.includes('HACKED')) return <Terminal className="w-6 h-6 text-[#00FF41]" />;
    if (productName.includes('Verified')) return <ShieldCheck className="w-6 h-6 text-green-500" />;
    return category === 'Spotlight' ? <Zap className="w-6 h-6 text-yellow-500" /> : <Sparkles className="w-6 h-6 text-accent" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <header className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-card border border-border p-4 rounded-2xl shadow-xl">
              <Crown className="w-10 h-10 text-accent" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-6">
            <Image 
              src="/hobbydork-main.png" 
              alt="hobbydork logo" 
              width={360} 
              height={90} 
              className="h-16 md:h-24 w-auto" 
              priority 
            />
            <span className="text-2xl md:text-4xl font-headline font-black tracking-tight text-primary uppercase">Store</span>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed font-medium mt-4">
            Upgrade your business. Stand out from the crowd and build a brand collectors trust.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PREMIUM_PRODUCTS.map((product) => {
            const isSpotlight = product.id === 'p1';
            const isCustom = product.id === 'p10';
            return (
              <Card 
                key={product.id} 
                className={cn(
                  "premium-card border bg-card shadow-lg flex flex-col group text-card-foreground relative overflow-hidden",
                  isSpotlight ? "border-yellow-500 ring-4 ring-yellow-500/10" : 
                  isCustom ? "border-pink-500 ring-4 ring-pink-500/10" : "border-border"
                )}
              >
                <div className="aspect-video bg-zinc-50 dark:bg-zinc-900 border-b flex items-center justify-center relative">
                   <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                      isSpotlight ? "bg-yellow-50 text-black shadow-xl scale-110" : 
                      isCustom ? "bg-pink-50 text-pink-600 shadow-xl scale-110" : "bg-white dark:bg-zinc-800 border shadow-sm"
                    )}>
                      {getIcon(product.name, product.category)}
                    </div>
                </div>

                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit text-[8px] uppercase tracking-widest font-bold">
                    {product.category}
                  </Badge>
                  <CardTitle className="text-xl font-black">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {product.description}
                  </p>
                  
                  {product.name.includes('Theme') && !isCustom && (
                    <ThemePreview themeName={product.name} />
                  )}

                  {isCustom && (
                    <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-200">
                       <ul className="text-[10px] font-black uppercase tracking-widest space-y-2 text-pink-700">
                          <li className="flex items-center gap-2">Unique 1-of-1 Architecture</li>
                          <li className="flex items-center gap-2">Custom CSS Hooks</li>
                          <li className="flex items-center gap-2">Personal Design Consultation</li>
                       </ul>
                    </div>
                  )}

                  {isSpotlight && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200">
                       <ul className="text-[10px] font-black uppercase tracking-widest space-y-2 text-yellow-700">
                          <li className="flex items-center gap-2">Home Page Top Banner</li>
                          <li className="flex items-center gap-2">Global Search Priority</li>
                          <li className="flex items-center gap-2">500k+ Weekly Impressions</li>
                       </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t pt-6 mt-4">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-2xl font-black">${product.price}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {isSpotlight ? 'Per Week' : isCustom ? 'One-time commission' : 'One-time'}
                    </span>
                  </div>
                  <Button 
                    onClick={() => handleOpenCheckout(product)}
                    className={cn(
                      "w-full h-12 font-bold rounded-xl shadow-md transition-all gap-2",
                      isSpotlight ? "bg-yellow-50 hover:bg-yellow-600 text-black" : 
                      isCustom ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-primary text-primary-foreground"
                    )}
                  >
                    Purchase Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <DialogTitle className="sr-only">Stripe Checkout</DialogTitle>
          <div className="bg-card text-foreground">
            <div className="bg-primary p-8 text-primary-foreground">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-accent/20 p-3 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
                <Lock className="w-4 h-4 opacity-40" />
              </div>
              <h2 className="text-3xl font-headline font-black italic mb-2 tracking-tight">Stripe Checkout</h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Item</p>
                  <p className="font-black text-lg">{selectedProduct?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Price</p>
                  <p className="font-black text-2xl text-accent">${selectedProduct?.price}</p>
                </div>
              </div>

              {selectedProduct?.id === 'p10' && (
                <div className="space-y-3">
                  <Label htmlFor="contact-info" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commission Contact Info</Label>
                  <Input 
                    id="contact-info"
                    placeholder="Email, Discord, or Phone"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="h-12 border-2 rounded-xl focus-visible:ring-pink-500"
                    required
                  />
                  <p className="text-[9px] text-muted-foreground font-medium italic">Our design team will contact you at this handle within 24 hours.</p>
                </div>
              )}

              <Button 
                onClick={handleStripeCheckout} 
                disabled={isProcessing}
                className="w-full h-16 bg-[#635BFF] hover:bg-[#5851E0] text-white rounded-2xl font-black text-xl shadow-xl"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Pay with Stripe"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
