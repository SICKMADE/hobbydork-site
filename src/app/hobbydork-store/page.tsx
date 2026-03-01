'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PREMIUM_PRODUCTS, PremiumProduct } from '@/lib/mock-data';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  ArrowRight, 
  Building2, 
  BookOpen, 
  Hammer, 
  Monitor, 
  Loader2,
  CreditCard,
  Lock,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * ThemePreview Component
 * Renders a high-fidelity miniature representation using CSS patterns and icons.
 * This is where the visual previews for the store themes live.
 */
function ThemePreview({ themeName }: { themeName: string }) {
  const isNeonSyndicate = themeName === 'Neon Syndicate Theme';
  const isComicBook = themeName === 'Comic Book Theme';
  const isUrban = themeName === 'Urban Theme';
  const isHobbyShop = themeName === 'Hobby Shop Theme';

  return (
    <div className={cn(
      "w-full aspect-[16/10] rounded-xl shadow-inner flex items-center justify-center p-4 transition-all duration-500 overflow-hidden relative border",
      isNeonSyndicate ? 'bg-zinc-950 border-cyan-500/30' : 
      isComicBook ? 'bg-white border-[4px] border-black rounded-none comic-dots' : 
      isUrban ? 'bg-slate-100 border-2 border-slate-300' : 
      isHobbyShop ? 'bg-[#355e3b] border-4 border-white/10 shadow-lg' :
      'bg-zinc-50 border-zinc-100'
    )}>
       <div className="w-full space-y-3 relative z-10">
          {/* Header Bar Simulation */}
          <div className={cn("h-4 rounded w-3/4", 
            isNeonSyndicate ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]' : 
            isComicBook ? 'bg-yellow-400 border-2 border-black' : 
            isHobbyShop ? 'bg-white' : 'bg-primary'
          )} />
          
          {/* Listing Grid Simulation */}
          <div className="grid grid-cols-2 gap-2 mt-4">
             {[1, 2].map((i) => (
               <div key={i} className={cn(
                 "h-16 rounded overflow-hidden flex flex-col", 
                 isComicBook ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : 
                 isHobbyShop ? "bg-white border border-white/30" : 
                 isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20" : 'bg-white border'
               )}>
                 <div className="h-8 w-full relative bg-muted/20 flex items-center justify-center">
                    <Package className="w-4 h-4 opacity-10" />
                 </div>
                 <div className="p-1 space-y-1">
                   <div className="h-1 w-2/3 bg-muted-foreground/20 rounded" />
                   <div className="h-1 w-1/3 bg-accent rounded" />
                 </div>
               </div>
             ))}
          </div>
       </div>
       {isNeonSyndicate && (
         <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
       )}
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

  const handleOpenCheckout = (product: PremiumProduct) => {
    if (!user) {
      toast({ variant: 'destructive', title: "Auth Required", description: "Sign in to upgrade your business." });
      return;
    }
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleStripeCheckout = async () => {
    if (!selectedProduct || !user) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ name: selectedProduct.name, price: selectedProduct.price, quantity: 1 }],
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: window.location.href,
          metadata: { productId: selectedProduct.id, buyerId: user.uid }
        }),
      });
      const data = await response.json();
      if (data.url) {
        router.push(data.url);
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
    if (productName.includes('Comic')) return <BookOpen className="w-6 h-6 text-orange-500" />;
    if (productName.includes('Neon Syndicate')) return <Monitor className="w-6 h-6 text-cyan-400" />;
    if (productName.includes('Urban')) return <Building2 className="w-6 h-6 text-blue-500" />;
    if (productName.includes('Hobby Shop')) return <Hammer className="w-6 h-6 text-green-600" />;
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
              alt="hobbydork" 
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
            const isSpotlight = product.name === 'Weekly Spotlight';
            return (
              <Card 
                key={product.id} 
                className={cn(
                  "premium-card border bg-card shadow-lg flex flex-col group text-card-foreground relative overflow-hidden",
                  isSpotlight ? "border-yellow-500 ring-4 ring-yellow-500/10" : "border-border"
                )}
              >
                <div className="aspect-video bg-zinc-50 dark:bg-zinc-900 border-b flex items-center justify-center relative">
                   <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                      isSpotlight ? "bg-yellow-500 text-black shadow-xl scale-110" : "bg-white dark:bg-zinc-800 border shadow-sm"
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
                  
                  {product.name.includes('Theme') && (
                    <ThemePreview themeName={product.name} />
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
                      {isSpotlight ? 'Per Week' : 'One-time'}
                    </span>
                  </div>
                  <Button 
                    onClick={() => handleOpenCheckout(product)}
                    className={cn(
                      "w-full h-12 font-bold rounded-xl shadow-md transition-all gap-2",
                      isSpotlight ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-primary text-primary-foreground"
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