'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  Sparkles, 
  Loader2, 
  Trophy, 
  Info, 
  DollarSign, 
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { estimatePrice, type EstimatePriceOutput } from '@/ai/flows/estimate-price-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

export default function PriceCheckPage() {
  const { toast } = useToast();
  const [photo, setPhoto] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimatePriceOutput | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: "Resolution Too High",
          description: "Please upload an image smaller than 10MB for the AI appraiser to analyze."
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runEstimation = async () => {
    if (!photo) {
      toast({ 
        variant: 'destructive', 
        title: 'Visual Asset Required', 
        description: 'Upload a clear photo of your item so the appraiser can analyze condition and rarity.' 
      });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await estimatePrice({ photoDataUri: photo, itemTitle });
      setResult(data);
      toast({
        title: "Appraisal Complete",
        description: "AI analysis has successfully estimated current market value."
      });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Appraisal Failed', 
        description: 'The AI was unable to determine a value. Ensure the item is centered and well-lit.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-12 space-y-2">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <Sparkles className="w-3 h-3" /> Expert Appraiser
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase italic">AI Price Check</h1>
          <p className="text-muted-foreground font-medium">Get an instant market valuation based on visual analysis and rarity data.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6 md:gap-8">
          <div className="space-y-8">
            <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-5 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-black uppercase tracking-widest">Identify Item (Optional)</Label>
                  <Input 
                    placeholder="e.g. 1968 Omega Speedmaster..." 
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    className="h-12 rounded-xl border-zinc-200"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-black uppercase tracking-widest">Upload Item Photo</Label>
                  {photo ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-zinc-100 group">
                      <Image src={photo} alt="Preview" fill className="object-cover" />
                      <button 
                        onClick={() => setPhoto(null)}
                        aria-label="Remove photo"
                        className="absolute top-4 right-4 bg-zinc-950/50 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-video border-4 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-zinc-50 transition-all border-zinc-200 group">
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-zinc-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-sm uppercase">Drop Photo Here</p>
                        <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-widest">JPEG or PNG up to 10MB</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>

                <Button 
                  onClick={runEstimation} 
                  disabled={loading || !photo}
                  className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xl rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      Get Estimate Now
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card className="border-none shadow-2xl bg-zinc-950 text-white rounded-[2rem] overflow-hidden animate-in zoom-in duration-500">
                <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-2">Estimated Market Value</p>
                    <h2 className="text-5xl font-black italic tracking-tighter">
                      ${result.estimatedValueRange.low.toLocaleString()} - ${result.estimatedValueRange.high.toLocaleString()}
                    </h2>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rarity Score</span>
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-black">{result.rarityScore}/10</p>
                      <Progress value={result.rarityScore * 10} className="h-1.5 bg-white/10" />
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Condition</span>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-base font-black uppercase tracking-tighter line-clamp-1">{result.conditionNotes}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-zinc-400" />
                      Market Analysis
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                      {result.marketAnalysis}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-6">
              <h3 className="font-black text-lg uppercase italic tracking-tighter">Appraisal Tips</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                  <p className="text-xs text-zinc-500 font-bold uppercase leading-relaxed">Ensure natural lighting for better detail detection.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                  <p className="text-xs text-zinc-500 font-bold uppercase leading-relaxed">Include box or papers in the frame if available.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                  <p className="text-xs text-zinc-500 font-bold uppercase leading-relaxed">Capture serial numbers for luxury assets.</p>
                </li>
              </ul>
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter leading-tight">
                  This estimate is for informational purposes only. Official appraisal requires physical inspection.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
