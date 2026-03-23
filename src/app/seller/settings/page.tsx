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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  ImageIcon,
  X,
  Crown,
  FileText,
  Terminal,
  Gamepad2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn, filterProfanity } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface ThemeOption {
  id: string; 
  name: string;
  className: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'default', name: 'Default', className: 'bg-zinc-100' },
  { id: 'p2', name: 'Neon Syndicate Theme', className: 'bg-zinc-950' },
  { id: 'p4', name: 'Comic Book Theme', className: 'bg-white comic-dots' },
  { id: 'p5', name: 'NES ORIGINAL THEME', className: 'bg-[#cccccc]' },
  { id: 'p7', name: 'Glitch Protocol Theme', className: 'bg-zinc-950' },
  { id: 'p8', name: 'Void Shard Theme', className: 'bg-zinc-950' },
  { id: 'p9', name: 'HACKED THEME', className: 'bg-black' },
  { id: 'p3', name: 'Urban Theme', className: "bg-[url('/brick-wall.png')] bg-repeat bg-[size:150px]" },
];

export default function StoreSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    tagline: '',
    category: '',
    description: '',
    selectedTheme: 'Default',
    bannerUrl: '',
    vacationMode: false,
  });

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const storeRef = useMemoFirebase(() => profile?.storeId && db ? doc(db, 'storefronts', profile.storeId) : null, [db, profile?.storeId]);
  const { data: storeData } = useDoc(storeRef);

  useEffect(() => {
    if (storeData) {
      setFormData({
        tagline: storeData.tagline || '',
        category: storeData.category || '',
        description: storeData.description || '',
        selectedTheme: storeData.theme || 'Default',
        bannerUrl: storeData.bannerUrl || '',
        vacationMode: !!storeData.vacationMode,
      });
    }
  }, [storeData]);

  const handleFilePicker = (e: React.ChangeEvent<HTMLInputElement>, field: 'bannerUrl') => {
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

    const sanitizedTagline = filterProfanity(formData.tagline);
    const sanitizedDescription = filterProfanity(formData.description);

    try {
      await updateDoc(storeRef, {
        tagline: sanitizedTagline,
        category: formData.category,
        description: sanitizedDescription,
        theme: formData.selectedTheme,
        bannerUrl: formData.bannerUrl,
        vacationMode: formData.vacationMode,
        updatedAt: serverTimestamp()
      });

      const sellerListingsQuery = query(collection(db, 'listings'), where('listingSellerId', '==', user.uid));
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
    if (profile?.role === 'ADMIN' || profile?.role === 'MODERATOR') return true;
    return profile?.ownedPremiumProducts?.includes(themeId);
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </Link>

        <header className="mb-12 space-y-2">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <Store className="w-3 h-3" /> Storefront Management
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tighter text-primary">Shop Customization</h1>
          <p className="text-muted-foreground font-medium">Build your brand identity and apply premium themes.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 lg:gap-12">
          <Tabs defaultValue="visuals" className="space-y-8">
            <TabsList className="bg-muted p-1 h-12 rounded-xl flex w-full sm:w-auto">
              <TabsTrigger value="visuals" className="flex-1 sm:flex-none px-6 font-black uppercase text-[10px] tracking-widest">Visuals</TabsTrigger>
              <TabsTrigger value="details" className="flex-1 sm:flex-none px-6 font-black uppercase text-[10px] tracking-widest">Details</TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1 sm:flex-none px-6 font-black uppercase text-[10px] tracking-widest">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="visuals" className="space-y-12">
              <section className="space-y-6">
                <h2 className="text-xl font-headline font-black uppercase flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-accent" /> Shop Banner
                </h2>
                <div className="grid gap-6">
                  <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden group relative">
                    <div className="relative h-48 w-full bg-muted dark:bg-zinc-900 overflow-hidden">
                      <Image 
                        src={formData.bannerUrl || '/hobbydork-banner-default.jpg'} 
                        alt="Banner Preview" 
                        fill 
                        className={cn("object-cover transition-all duration-500", formData.bannerUrl ? "opacity-100 scale-100" : "opacity-40 scale-105")} 
                      />
                      <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-zinc-950/40 dark:bg-black/40 dark:group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-3 z-10 backdrop-blur-[2px]">
                        <label htmlFor="store-banner-file" className="flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-zinc-200 dark:border-white/20 transition-all text-zinc-950 dark:text-white group/btn shadow-xl active:scale-95">
                          <ImageIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Change Store Banner</span>
                          <input id="store-banner-file" type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePicker(e, 'bannerUrl')} />
                        </label>
                        {formData.bannerUrl && (
                          <button 
                            onClick={() => setFormData({...formData, bannerUrl: ''})} 
                            className="text-[9px] font-black uppercase tracking-widest text-zinc-950/60 hover:text-zinc-950 dark:text-white/60 dark:hover:text-white transition-colors bg-white/50 dark:bg-transparent px-3 py-1 rounded-full backdrop-blur-sm"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </section>
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-20 bg-primary text-primary-foreground font-black text-2xl rounded-2xl shadow-xl uppercase italic tracking-tighter">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-2" />} Save Store Profile
              </Button>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-12">
              <section className="space-y-6">
                <h2 className="text-xl font-headline font-black uppercase flex items-center gap-3">
                  <Layout className="w-5 h-5 text-accent" /> Shop Appearance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {THEME_OPTIONS.map((theme) => {
                    const isActive = formData.selectedTheme === theme.name;
                    const owned = isThemeOwned(theme.id);
                    const isGameTheme = theme.name === 'NES ORIGINAL THEME';
                    const isHacked = theme.name === 'HACKED THEME';
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
                            "w-full h-4 rounded transition-all duration-500",
                            theme.name === 'Neon Syndicate Theme' ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 
                            theme.name === 'Comic Book Theme' ? 'bg-yellow-400 border-2 border-black' : 
                            theme.name === 'NES ORIGINAL THEME' ? 'bg-red-600 shadow-[0_4px_0_0_#a00000] rounded-full w-8 h-8' : 
                            theme.name === 'Glitch Protocol Theme' ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-rgb' : 
                            theme.name === 'Void Shard Theme' ? 'bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.8)] animate-void' :
                            isHacked ? 'bg-[#00FF41] shadow-[0_0_15px_#00FF41]' :
                            'bg-primary'
                          )} />
                        </div>
                        <CardContent className="p-4 flex justify-between items-center bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white">
                          <span className="text-xs font-black uppercase tracking-tight">{theme.name}</span>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-accent" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-20 bg-primary text-primary-foreground font-black text-2xl rounded-2xl shadow-xl uppercase italic tracking-tighter">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-2" />} Save Store Profile
              </Button>
            </TabsContent>

            <TabsContent value="details" className="space-y-12">
              <section className="space-y-6">
                <h2 className="text-xl font-headline font-black uppercase flex items-center gap-3">
                  <FileText className="w-5 h-5 text-accent" /> Shop Details
                </h2>
                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-card">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between gap-4 rounded-xl border-2 p-4">
                      <div className="space-y-1">
                        <Label htmlFor="vacation-mode-switch" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vacation Mode</Label>
                        <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                          Pause marketplace discovery while you are away.
                        </p>
                      </div>
                      <Switch
                        id="vacation-mode-switch"
                        checked={formData.vacationMode}
                        onCheckedChange={(checked) => setFormData({ ...formData, vacationMode: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-tagline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Tagline</Label>
                      <Input 
                        id="store-tagline"
                        value={formData.tagline} 
                        onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                        className="h-14 rounded-xl border-2 font-bold text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store-category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                        <SelectTrigger id="store-category" className="h-14 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store-description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About the Shop</Label>
                      <Textarea 
                        id="store-description"
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="min-h-[150px] rounded-xl border-2 font-medium"
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-20 bg-primary text-primary-foreground font-black text-2xl rounded-2xl shadow-xl uppercase italic tracking-tighter">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-2" />} Save Store Profile
              </Button>
            </TabsContent>
          </Tabs>

          <aside className="space-y-6">
            <div className="bg-muted/40 dark:bg-card/60 text-foreground dark:text-white p-8 rounded-[2.5rem] shadow-2xl border border-border dark:border-white/5 sticky top-24">
              <h3 className="font-headline font-black text-xl mb-8 uppercase italic tracking-tighter flex items-center gap-2 text-accent border-b border-border dark:border-white/5 pb-4"><Sparkles className="w-5 h-5" /> Shop Tips</h3>
              <ul className="space-y-8">
                <li className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-white/40 tracking-widest">Level Up</p>
                  <p className="text-xs font-bold leading-relaxed">The NES ORIGINAL THEME turns your shop into a retro arcade. Use it to build a nostalgic, high-energy brand for collectors.</p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
