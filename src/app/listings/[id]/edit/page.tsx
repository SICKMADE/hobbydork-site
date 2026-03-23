'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/lib/mock-data';
import { cn, filterProfanity } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, Loader2, X, Truck, Calculator, Sparkles, ShieldCheck, Zap, Plus } from 'lucide-react';
import Link from 'next/link';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Used'>('New');
  const [visibility, setVisibility] = useState<'Visible' | 'Invisible'>('Visible');
  const [type, setType] = useState('bin');
  const [photo, setPhoto] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [shippingType, setShippingType] = useState<'Free' | 'Paid'>('Free');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [quantity, setQuantity] = useState('1');


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const listingRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'listings', id);
  }, [db, id]);

  const { data: listing } = useDoc(listingRef);

  useEffect(() => {
    if (!listing || !user) return;

    if (listing.listingSellerId !== user.uid) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'You can only edit your own listings.' });
      router.push(`/listings/${id}`);
      return;
    }

    setTitle(listing.title || '');
    setDescription(listing.description || '');
    setPrice(String(listing.price || ''));
    setCategory(listing.category || '');
    setCondition(listing.condition || 'New');
    setVisibility(listing.visibility || 'Visible');
    setType(listing.type === 'Buy It Now' ? 'bin' : 'auction');
    setPhoto(listing.imageUrl || '');
    setTags(listing.tags || []);
    setShippingType(listing.shippingType || 'Free');
    setWeight(String(listing.weight || ''));
    setLength(String(listing.length || ''));
    setWidth(String(listing.width || ''));
    setHeight(String(listing.height || ''));
    setCalculatedShippingCost(listing.shippingCost || null);
    setQuantity(String(listing.quantity || '1'));
    setIsLoading(false);
  }, [listing, user, id, router, toast]);

  const uploadPhotoToStorage = async (photoDataUri: string): Promise<string> => {
    const storage = getStorage();
    const fileName = `listings/${user!.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    const response = await fetch(photoDataUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const compressImageForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = document.createElement('img');
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 1600;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to process image'));
            return;
          }
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        image.onerror = () => reject(new Error('Invalid image file'));
        image.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (file: File) => {
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      toast({ variant: 'destructive', title: "Invalid Format" });
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ variant: 'destructive', title: "File Too Large" });
      return;
    }

    try {
      const optimizedImage = await compressImageForUpload(file);
      setPhoto(optimizedImage);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Processing Failed' });
    }
  };

  const calculateShipping = async () => {
    if (!weight || !length || !width || !height) {
      toast({ variant: 'destructive', title: 'Missing Info' });
      return;
    }

    setIsCalculatingShipping(true);
    try {
      const rate = parseFloat(weight) * 2 + (parseFloat(length) + parseFloat(width) + parseFloat(height)) * 0.1;
      setCalculatedShippingCost(Math.round(rate * 100) / 100);
      toast({ title: 'Calculated' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Calculation Failed' });
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !title || !price || !category || !listingRef) return;

    setIsSubmitting(true);

    try {
      const sanitizedTitle = filterProfanity(title);
      const sanitizedDescription = filterProfanity(description);

      let imageUrl = photo;
      if (photo && photo.startsWith('data:')) {
        imageUrl = await uploadPhotoToStorage(photo);
      }

      const updateData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: parseFloat(price),
        category,
        condition,
        visibility,
        tags,
        shippingType,
        weight: shippingType === 'Paid' ? parseFloat(weight) || null : null,
        length: shippingType === 'Paid' ? parseFloat(length) || null : null,
        width: shippingType === 'Paid' ? parseFloat(width) || null : null,
        height: shippingType === 'Paid' ? parseFloat(height) || null : null,
        shippingCost: calculatedShippingCost || null,
        quantity: type === 'bin' ? Math.max(1, parseInt(quantity) || 1) : null,
        imageUrl: imageUrl,
        updatedAt: serverTimestamp()
      };

      await updateDoc(listingRef, updateData);
      toast({ title: 'Updated!' });
      router.push(`/listings/${id}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: getFriendlyErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="lg" className="rounded-xl border-2">
              <Link href={`/listings/${id}`}><ArrowLeft className="w-5 h-5 mr-2" /> Back</Link>
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
                <Zap className="w-3 h-3" /> Editor Protocol
              </div>
              <h1 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter text-primary leading-none">Modify Asset</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            {/* Visuals */}
            <section className="space-y-6">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Imagery</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photo && (
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-900 group shadow-2xl">
                    <Image src={photo} alt="Preview" fill className="object-cover" />
                      <button type="button" onClick={() => setPhoto('')} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all" title="Remove photo"><X className="w-4 h-4" /></button>
                  </div>
                )}
                <label htmlFor="photo-picker" className="aspect-video border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                  <Plus className="w-8 h-8 text-zinc-400 group-hover:text-accent" />
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Replace Visual</span>
                  <input id="photo-picker" type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoUpload(f);
                  }} />
                </label>
              </div>
            </section>

            {/* Manifest */}
            <section className="space-y-8 bg-muted/40 dark:bg-card/60 p-8 rounded-[2rem] border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-bold text-lg text-zinc-950 focus-visible:ring-accent shadow-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-black text-zinc-950 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-zinc-200">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Condition</Label>
                  <Select value={condition} onValueChange={v => setCondition(v as any)}>
                    <SelectTrigger className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-black text-zinc-950 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-zinc-200"><SelectItem value="New">NEW</SelectItem><SelectItem value="Like New">LIKE NEW</SelectItem><SelectItem value="Used">USED</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visibility Protocol</Label>
                <RadioGroup value={visibility} onValueChange={v => setVisibility(v as any)} className="grid grid-cols-2 gap-4">
                  <Label htmlFor="vis-v" className={cn("h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", visibility === 'Visible' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                    <RadioGroupItem value="Visible" id="vis-v" className="sr-only" /> Visible
                  </Label>
                  <Label htmlFor="vis-i" className={cn("h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", visibility === 'Invisible' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                    <RadioGroupItem value="Invisible" id="vis-i" className="sr-only" /> Invisible
                  </Label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description Manifest</Label>
                <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[150px] rounded-xl border-2 border-zinc-200 bg-white font-medium text-base text-zinc-950 focus-visible:ring-accent shadow-sm" />
              </div>
            </section>

            {/* Pricing */}
            <section className="space-y-8 bg-muted/40 dark:bg-card/60 p-8 rounded-[2rem] border border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Format</Label>
                  <RadioGroup value={type} onValueChange={setType} className="flex gap-3">
                    <Label htmlFor="type-bin-radio" className={cn("flex-1 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", type === 'bin' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                      <RadioGroupItem value="bin" id="type-bin-radio" className="sr-only" /> Buy It Now
                    </Label>
                    <Label htmlFor="type-auc-radio" className={cn("flex-1 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", type === 'auction' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                      <RadioGroupItem value="auction" id="type-auc-radio" className="sr-only" /> Auction
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Value</Label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-accent font-black text-lg">$</span>
                    <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required className="h-14 pl-10 rounded-xl border-2 border-zinc-200 bg-white font-black text-xl text-zinc-950 focus-visible:ring-accent shadow-sm" />
                  </div>
                </div>
              </div>
              {type === 'bin' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Protocol</Label>
                  <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-black text-zinc-950 shadow-sm" />
                </div>
              )}
            </section>

            {/* Shipping */}
            <section className="space-y-8 bg-muted/40 dark:bg-card/60 p-8 rounded-[2rem] border border-border/50">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-2xl"><Truck className="w-6 h-6 text-accent" /></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">Shipping Protocol</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Delivery Configuration</p>
                </div>
              </div>
              <RadioGroup value={shippingType} onValueChange={v => setShippingType(v as any)} className="grid grid-cols-2 gap-4">
                <Label htmlFor="ship-free-radio" className={cn("h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", shippingType === 'Free' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                  <RadioGroupItem value="Free" id="ship-free-radio" className="sr-only" /> Free Shipping
                </Label>
                <Label htmlFor="ship-paid-radio" className={cn("h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", shippingType === 'Paid' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                  <RadioGroupItem value="Paid" id="ship-paid-radio" className="sr-only" /> Flat Rate Shipping
                </Label>
              </RadioGroup>
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full h-24 bg-white text-zinc-950 hover:bg-zinc-100 font-black text-3xl rounded-[2rem] shadow-2xl uppercase italic tracking-tighter transition-all active:scale-95 group">
              {isSubmitting ? <Loader2 className="animate-spin" /> : (
                <div className="flex items-center justify-center gap-4">
                  Update Catalog
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </div>
              )}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-muted/40 dark:bg-card/60 text-foreground dark:text-white p-8 rounded-[2.5rem] shadow-2xl border border-border dark:border-white/5 sticky top-24">
              <h3 className="font-headline font-black text-xl mb-8 uppercase italic tracking-tighter flex items-center gap-2 text-accent border-b border-border dark:border-white/5 pb-4"><Sparkles className="w-5 h-5" /> Manifest Protocol</h3>
              <ul className="space-y-10">
                <li className="space-y-3">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest"><Truck className="w-4 h-4" /> 48-Hour Protocol</div>
                  <p className="text-[11px] font-bold text-muted-foreground dark:text-zinc-500 leading-relaxed uppercase tracking-tight">Updating inventory counts or price maintains your discovery engine rank.</p>
                </li>
                <li className="space-y-3">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest"><ShieldCheck className="w-4 h-4" /> Policy Check</div>
                  <p className="text-[11px] font-bold text-muted-foreground dark:text-zinc-500 leading-relaxed uppercase tracking-tight">Ensure description edits remain 100% accurate to current condition.</p>
                </li>
              </ul>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
