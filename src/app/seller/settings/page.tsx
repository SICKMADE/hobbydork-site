'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/mock-data';
import { 
  Store, 
  Palette, 
  Layout, 
  Save, 
  Loader2, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lock,
  Crown,
  Camera,
  ImageIcon,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface ThemeOption {
  id: string; // Product ID from PREMIUM_PRODUCTS
  name: string;
  className: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'default', name: 'Default', className: 'bg-zinc-100' },
  { id: 'p2', name: 'Neon Syndicate Theme', className: 'bg-zinc-950' },
  { id: 'p4', name: 'Comic Book Theme', className: 'bg-white comic-dots' },
  { id: 'p5', name: 'Hobby Shop Theme', className: 'bg-[#355e3b]' },
  { id: 'p3', name: 'Urban Theme', className: 'bg-slate-100' },
];

export default function StoreSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [ownedItemIds, setOwnedItems] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    tagline: '',
    category: '',
    description: '',
    selectedTheme: 'Default',
    bannerUrl: '',
    avatarUrl: '',
    vacationMode: false,
  });

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const storeRef = useMemoFirebase(() => profile?.storeId && db ? doc(db, 'storefronts', profile.storeId) : null, [db, profile?.storeId]);
  const { data: storeData } = useDoc(storeRef);

  useEffect(() => {
    const owned = JSON.parse(localStorage.getItem('hobbydork_owned_items') || '[]');
    setOwnedItems(owned);
  }, []);

  useEffect(() => {
    if (storeData) {
      setFormData({
        tagline: storeData.tagline || '',
        category: storeData.category || '',
        description: storeData.description || '',
        selectedTheme: storeData.theme || 'Default',
        bannerUrl: storeData.bannerUrl || '',
        avatarUrl: storeData.avatarUrl || '',
        vacationMode: !!storeData.vacationMode,
      });
    }
  }, [storeData]);

  const handleFilePicker = (e: React.ChangeEvent<HTMLInputElement>, field: 'bannerUrl' | 'avatarUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: "File too large (Max 5MB)" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!db || !storeRef || !user) return;
    setIsSaving(true);

    // Apply global profanity filter
    const sanitizedTagline = filterProfanity(formData.tagline);
    const sanitizedDescription = filterProfanity(formData.description);

    try {
      await updateDoc(storeRef, {
        tagline: sanitizedTagline,
        category: formData.category,
        description: sanitizedDescription,
        theme: formData.selectedTheme,
        bannerUrl: formData.bannerUrl,
        avatarUrl: formData.avatarUrl,
        vacationMode: formData.vacationMode,
        updatedAt: serverTimestamp()
      });

      const sellerListingsQuery = query(collection(db, 'listings'), where('sellerId', '==', user.uid));
      const sellerListingsSnapshot = await getDocs(sellerListingsQuery);

      if (!sellerListingsSnapshot.empty) {
        let batch = writeBatch(db);
        let operations = 0;

        for (const listingDoc of sellerListingsSnapshot.docs) {
          batch.update(listingDoc.ref, {
            sellerOnVacation: formData.vacationMode,
            updatedAt: serverTimestamp(),
          });
          operations += 1;

          if (operations >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            operations = 0;
          }
        }

        if (operations > 0) {
          await batch.commit();
        }
      }

      toast({
        title: "Storefront Updated",
        description: formData.vacationMode
          ? "Vacation Mode is ON. Your listings are hidden from marketplace discovery."
          : "Vacation Mode is OFF. Your listings are discoverable again.",
      });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const isThemeOwned = (themeId: string) => {
    if (themeId === 'default') return true;
    return ownedItemIds.includes(themeId);
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </Link>

        <header className="mb-12 space-y-2">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <Store className="w-3 h-3" /> Storefront Management
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tighter">Shop Customization</h1>
          <p className="text-muted-foreground font-medium">Build your brand identity and apply premium themes.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 lg:gap-12">
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-headline font-black uppercase flex items-center gap-3">
                <Camera className="w-5 h-5 text-accent" /> Shop Visuals
              </h2>
              <div className="grid gap-6">
                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden group relative">
                  <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                    <Image 
                      src={formData.bannerUrl || '/hobbydork-banner-default.png'} 
                      alt="Banner Preview" 
                      fill 
                      className={cn("object-cover transition-opacity duration-500", formData.bannerUrl ? "opacity-100" : "opacity-40")} 
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-3 z-10">
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 transition-all text-white group/btn">
                        <ImageIcon className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Change Store Banner</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePicker(e, 'bannerUrl')} />
                      </label>
                      {formData.bannerUrl && (
                        <button 
                          onClick={() => setFormData({...formData, bannerUrl: ''})} 
                          className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="flex gap-8 items-end">
                  <div className="relative w-32 h-32 rounded-[2.5rem] bg-zinc-100 overflow-hidden border-4 border-white shadow-2xl group shrink-0">
                    {formData.avatarUrl ? (
                      <>
                        <Image src={formData.avatarUrl} alt="Avatar" fill className="object-cover" />
                        <button type="button" title="Remove shop avatar" aria-label="Remove shop avatar" onClick={() => setFormData({...formData, avatarUrl: ''})} className="absolute top-2 right-2 z-20 bg-zinc-950/50 text-white rounded-full p-1.5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><Store className="w-12 h-12" /></div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" aria-label="Upload shop avatar" title="Upload shop avatar" className="hidden" onChange={(e) => handleFilePicker(e, 'avatarUrl')} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shop Avatar</h4>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">Your professional brand icon. Appears on the Trust Board and marketplace listings.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-headline font-black uppercase flex items-center gap-3">
                <Palette className="w-5 h-5 text-accent" /> Shop Details
              </h2>
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between gap-4 rounded-xl border-2 p-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vacation Mode</Label>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                        Pause marketplace discovery while you are away. Buyers won't see your listings in browse/search.
                      </p>
                    </div>
                    <Switch
                      checked={formData.vacationMode}
                      onCheckedChange={(checked) => setFormData({ ...formData, vacationMode: checked })}
                      aria-label="Toggle vacation mode"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Tagline</Label>
                    <Input 
                      value={formData.tagline} 
                      placeholder="e.g. Rare collectibles curated with passion."
                      onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                      className="h-14 rounded-xl border-2 font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About the Shop</Label>
                    <Textarea 
                      value={formData.description} 
                      placeholder="Share your story as a collector..."
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="min-h-[150px] rounded-xl border-2 font-medium"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-headline font-black uppercase flex items-center gap-3">
                <Layout className="w-5 h-5 text-accent" /> Shop Appearance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {THEME_OPTIONS.map((theme) => {
                  const isActive = formData.selectedTheme === theme.name;
                  const owned = isThemeOwned(theme.id);
                  
                  return (
                    <Card 
                      key={theme.id} 
                      className={cn(
                        "transition-all duration-300 rounded-2xl overflow-hidden border-2 group relative",
                        !owned ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer",
                        isActive ? "border-accent ring-4 ring-accent/10 shadow-2xl" : "border-transparent hover:border-zinc-200"
                      )}
                      onClick={() => owned && setFormData({...formData, selectedTheme: theme.name})}
                    >
                      {!owned && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                          <div className="bg-zinc-950 text-white p-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-accent" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Store Item</span>
                          </div>
                        </div>
                      )}
                      <div className={cn(
                        "h-32 w-full flex items-center justify-center p-4",
                        theme.className
                      )}>
                        <div className={cn(
                          "w-full h-4 rounded",
                          theme.name === 'Neon Syndicate Theme' ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 
                          theme.name === 'Comic Book Theme' ? 'bg-yellow-400 border-2 border-black' : 
                          theme.name === 'Hobby Shop Theme' ? 'bg-white' : 'bg-primary'
                        )} />
                      </div>
                      <CardContent className="p-4 flex justify-between items-center bg-white dark:bg-zinc-900">
                        <span className="text-xs font-black uppercase tracking-tight">{theme.name}</span>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </CardContent>
                    </Card>
                  );
                })}
                <Link href="/hobbydork-store" className="group">
                  <Card className="h-full border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 hover:border-accent hover:bg-accent/5 transition-all">
                    <Crown className="w-8 h-8 text-zinc-300 group-hover:text-accent transition-colors" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-accent">Unlock More Themes</p>
                  </Card>
                </Link>
              </div>
            </section>

            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full h-20 bg-accent text-white font-black text-2xl rounded-2xl shadow-xl shadow-accent/20 uppercase italic tracking-tighter transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <div className="flex items-center gap-3">
                  <Save className="w-6 h-6" />
                  Save Store Profile
                </div>
              )}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
              <h3 className="font-headline font-black text-xl mb-6 uppercase italic tracking-tighter flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> Shop Tips
              </h3>
              <ul className="space-y-8">
                <li className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Brand Voice</p>
                  <p className="text-xs font-bold leading-relaxed">Keep your tagline focused on your collector niche to attract high-value buyers.</p>
                </li>
                <li className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Themes</p>
                  <p className="text-xs font-bold leading-relaxed">Applying a premium theme overhaul's your Shop Header and Giveaway styling.</p>
                </li>
                <li className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Visual Identity</p>
                  <p className="text-xs font-bold leading-relaxed">Upload a clean banner and a recognizable icon to build instant community trust.</p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
