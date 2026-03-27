'use client';

import { useState, useEffect } from 'react';
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
  Brush,
  ArrowLeft,
  Settings
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
import Link from 'next/link';

/**
 * ThemePreview Component - Shows a visual representation of store themes
 */
function ThemePreview({ themeName }: { themeName: string }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isNeonSyndicate = themeName.toLowerCase().includes('neon');
  const isComicBook = themeName.toLowerCase().includes('comic');
  const isUrban = themeName.toLowerCase().includes('urban');
  const is8BitTheme = themeName.toLowerCase().includes('8-bit');
  const isGlitchProtocol = themeName.toLowerCase().includes('glitch');
  const isVoidShard = themeName.toLowerCase().includes('void');
  const isHacked = themeName.toLowerCase().includes('hacked');

  const arcadeWindowsPattern = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'%3E%3Crect width='40' height='60' fill='%230a0a1a'/%3E%3Crect x='5' y='5' width='12' height='20' fill='%231a1a3a'/%3E%3Crect x='22' y='5' width='12' height='20' fill='%231a1a3a'/%3E%3C/svg%3E";

  return (
    <div
      className={cn(
        "w-full aspect-[16/10] rounded-xl shadow-inner flex items-center justify-center p-4 transition-all duration-500 overflow-hidden relative border",
        isNeonSyndicate ? 'bg-zinc-950 border-cyan-500/30' :
        isComicBook ? 'bg-white border-[4px] border-black rounded-none comic-dots' :
        isUrban ? "bg-white border-2 border-zinc-200 urban-wall-bg" :
        is8BitTheme ? 'bg-[#0a0a1a] border-none shadow-[4px_4px_0_0_#000,0_4px_0_0_#000,-4px_0_0_0_#000,0_-4px_0_0_#000]' :
        isGlitchProtocol ? 'bg-zinc-800 border-2 border-red-600' :
        isVoidShard ? 'bg-[#313131] border-2 border-violet-500/30 overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.2)]' :
        isHacked ? 'bg-black border-2 border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.1)]' :
        'bg-zinc-50 border-zinc-100',
        isUrban && 'urban-wall-bg'
      )}
    >
       {is8BitTheme && (
         <div className="absolute inset-0 opacity-10 pointer-events-none arcade-windows-bg" />
       )}
       {(isGlitchProtocol || isVoidShard) && (
         <div className="absolute inset-0 hardware-grid-overlay opacity-10" />
       )}
       {isVoidShard && (
         <div className="absolute inset-0 pointer-events-none void-shard-bg" />
       )}
       {isHacked && mounted && (
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
            is8BitTheme ? 'bg-pink-600 shadow-[4px_4px_0_0_#000]' : 
            isGlitchProtocol ? 'bg-red-600 shadow-[0_0_15px_red]' : 
            isVoidShard ? 'bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.6)]' :
            isHacked ? 'bg-[#00FF41] shadow-[0_0_15px_#00FF41]' :
            isUrban ? 'bg-white border-2 border-zinc-200 shadow-xl' :
            'bg-primary'
          )} />
          
          <div className="grid grid-cols-2 gap-2 mt-4">
             {[1, 2].map((i) => (
               <div key={i} className={cn(
                 "h-16 rounded overflow-hidden flex flex-col", 
                 isComicBook ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : 
                 is8BitTheme ? "bg-[#0a0a1a] border-2 border-white/10 shadow-[2px_2px_0_0_#000]" : 
                 isUrban ? "bg-white border-zinc-200 border-2 shadow-lg relative" : 
                 isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20" : 
                 isGlitchProtocol ? "bg-zinc-800 border border-red-600/40" : 
                 isVoidShard ? "bg-zinc-900 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]" :
                 isHacked ? "bg-black border border-[#00FF41]/30 rounded-none" :
                 'bg-white border'
               )}>
                 {isUrban && (
                   <>
                     <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-zinc-400" />
                     <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 rounded-full bg-zinc-400" />
                   </>
                 )}
                 <div className="h-8 w-full relative bg-muted/20 flex items-center justify-center">
                    <Package className="w-4 h-4 opacity-10" />
                 </div>
                 <div className="p-1 space-y-1">
                   <div className={cn("h-1 w-2/3 rounded", isHacked ? "bg-[#00FF41]/20" : "bg-muted-foreground/20")} />
                   <div className={cn("h-1 w-1/3 rounded", isHacked ? "bg-[#00FF41]" : is8BitTheme ? "bg-cyan-400" : isVoidShard ? "bg-violet-400" : isUrban ? "bg-black" : "bg-accent")} />
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
      toast({ variant: 'destructive', title: "Sign in Required", description: "Please sign in to buy upgrades for your shop." });
      return;
    }
    setSelectedProduct(product);
    setContactInfo('');
    setIsDialogOpen(true);
  };

  const handleStripeCheckout = async () => {
    if (!selectedProduct || !user) return;
    
    if (selectedProduct.id === 'p10' && !contactInfo.trim()) {
      toast({ variant: 'destructive', title: "Information Required", description: "Please provide contact info so our design team can reach you." });
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
      toast({ variant: 'destructive', title: "Payment Error", description: "There was a problem starting your purchase." });
      setIsProcessing(false);
    }
  };

  const getIcon = (productName: string, category: string) => {
    if (productName.includes('Weekly Spotlight')) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (productName.includes('Custom 1-of-1')) return <Brush className="w-6 h-6 text-pink-500" />;
    if (productName.includes('Comic')) return <BookOpen className="w-6 h-6 text-orange-500" />;
    if (productName.includes('Neon Syndicate')) return <Monitor className="w-6 h-6 text-cyan-400" />;
    if (productName.includes('Urban')) return <Building2 className="w-6 h-6 text-blue-500" />;
    if (productName.includes('8-BIT')) return <Gamepad2 className="w-6 h-6 text-pink-500" />;
    if (productName.includes('Glitch Protocol')) return <Radio className="w-6 h-6 text-white animate-pulse" />;
    if (productName.includes('Void Shard')) return <Ghost className="w-6 h-6 text-violet-400" />;
    if (productName.includes('HACKED')) return <Terminal className="w-6 h-6 text-[#00FF41]" />;
    if (productName.includes('Verified')) return <ShieldCheck className="w-6 h-6 text-green-500" />;
    return category === 'Spotlight' ? <Zap className="w-6 h-6 text-yellow-500" /> : <Sparkles className="w-6 h-6 text-accent" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-0 mb-4">
        <div 
          className="max-w-3xl mx-auto rounded-b-2xl p-4 md:p-6 shadow-2xl text-white relative overflow-hidden dark-grey-grid-bg"
        >
          <div className="text-center space-y-2 relative z-10">
            <div className="flex justify-center mb-2">
                <Image 
                  src="/hobbydorkstore.jpg" 
                  alt="Hobbydork Store" 
                  width={520} 
                  height={520} 
                  className="rounded-full border-4 border-white/10 shadow-2xl"
                />
            </div>
            <p className="text-white/80 text-base md:text-lg font-medium font-headline font-black">
              Premium Upgrades for your Storefront
            </p>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight">The hobbydork Store</h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
            Boost your visibility and stand out from the crowd. These upgrades help you build a professional brand that collectors trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PREMIUM_PRODUCTS.map((product) => {
            const isSpotlight = product.id === 'p1';
            const isCustom = product.id === 'p10';
            const isTheme = product.name.toLowerCase().includes('theme');
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
                  
                  {isTheme && !isCustom && (
                    <ThemePreview themeName={product.name} />
                  )}

                  {isCustom && (
                    <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-200">
                       <ul className="text-[10px] font-black uppercase tracking-widest space-y-2 text-pink-700">
                          <li className="flex items-center gap-2">Unique 1-of-1 Architecture</li>
                          <li className="flex items-center gap-2">Custom Styling</li>
                          <li className="flex items-center gap-2">Personal Consultation</li>
                       </ul>
                    </div>
                  )}

                  {isSpotlight && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200">
                       <ul className="text-[10px] font-black uppercase tracking-widest space-y-2 text-yellow-700">
                          <li className="flex items-center gap-2">Home Page Banner</li>
                          <li className="flex items-center gap-2">Search Priority</li>
                          <li className="flex items-center gap-2">Maximum Exposure</li>
                       </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t pt-6 mt-4">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-2xl font-black">${product.price}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {isSpotlight ? 'Per Week' : isCustom ? 'One-time' : 'One-time'}
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
                    Buy Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <DialogTitle className="sr-only">Checkout</DialogTitle>
          <div className="bg-card text-foreground">
            <div className="bg-primary p-8 text-primary-foreground">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-accent/20 p-3 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
                <Lock className="w-4 h-4 opacity-40" />
              </div>
              <h2 className="text-3xl font-headline font-black italic mb-2 tracking-tight">Checkout</h2>
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
                  <Label htmlFor="contact-info" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Info</Label>
                  <Input 
                    id="contact-info"
                    placeholder="Email or Discord handle"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="h-12 border-2 rounded-xl focus-visible:ring-pink-500"
                    required
                  />
                  <p className="text-[9px] text-muted-foreground font-medium italic">Our design team will contact you within 24 hours.</p>
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
