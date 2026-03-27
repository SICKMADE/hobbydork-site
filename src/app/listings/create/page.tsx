'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { app } from '@/firebase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CATEGORIES } from '@/lib/mock-data';
import { 
  Camera, 
  Sparkles, 
  Loader2, 
  X, 
  Truck, 
  Zap, 
  Monitor, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Calculator, 
  Plus, 
  ArrowRight,
  Clock,
  Layout
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { cn, filterProfanity } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CreateListing() {
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const { photos, setPhotos, handlePhotoUpload, removePhoto } = usePhotoUpload();
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('bin');
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Used'>('Used');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'Visible' | 'Invisible'>('Visible');
  const [shippingType, setShippingType] = useState<'Free' | 'Paid'>('Free');
  const [quantity, setQuantity] = useState('1');
  
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem('hobbydork_listing_draft');
    if (savedDraft) {
      try {
        const data = JSON.parse(savedDraft);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setPrice(data.price || '');
        setType(data.type || 'bin');
        setCondition(data.condition || 'Used');
        setTags(data.tags || []);
        setShippingType(data.shippingType || 'Free');
        setQuantity(data.quantity || '1');
        setWeight(data.weight || '');
        setLength(data.length || '');
        setWidth(data.width || '');
        setHeight(data.height || '');
        toast({ title: "Draft Restored" });
      } catch (e) {
        console.error("Draft recovery failed");
      }
    }
    setIsDraftLoaded(true);
  }, [toast]);

  useEffect(() => {
    if (!isDraftLoaded) return;
    const timer = setTimeout(() => {
      const draft = { 
        title, description, category, price, type, 
        condition, tags, shippingType, quantity,
        weight, length, width, height 
      };
      localStorage.setItem('hobbydork_listing_draft', JSON.stringify(draft));
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, description, category, price, type, condition, tags, shippingType, quantity, weight, length, width, height, isDraftLoaded]);

  useEffect(() => {
    if (!showCamera) return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: { facingMode: 'environment' }});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [showCamera, toast]);

  const capturePhoto = () => {
    if (videoRef.current && hasCameraPermission) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setPhotos(prev => [...prev, canvas.toDataURL('image/jpeg')]);
      setShowCamera(false);
    }
  };

  const calculateShipping = async () => {
    if (!weight || !length || !width || !height) {
      toast({ variant: 'destructive', title: "Missing dimensions", description: "Enter package details to calculate cost." });
      return;
    }
    setIsCalculatingShipping(true);
    setTimeout(() => {
      const mockRate = (parseFloat(weight) * 2.5) + (parseFloat(length) * 0.5);
      setShippingCost(Math.round(mockRate * 100) / 100);
      setIsCalculatingShipping(false);
      toast({ title: "Rate Calculated" });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading || !user || !user.uid || !db || !title || !price || !category) {
      toast({ variant: 'destructive', title: 'Please wait', description: 'User authentication is still loading or missing.' });
      return;
    }

    if (!user.emailVerified || !profile?.isSeller || profile?.status !== 'ACTIVE') {
      toast({ 
        variant: 'destructive', 
        title: 'Action Denied', 
        description: 'Verification required to list items.' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedTitle = filterProfanity(title);
      const sanitizedDescription = filterProfanity(description);
      // 1. Create Firestore doc first (without images)
      const listingData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: parseFloat(price),
        category,
        condition,
        type: type === 'bin' ? 'Buy It Now' : 'Auction',
        sellerName: profile?.username || 'Collector',
        sellerId: user.uid,
        listingSellerId: user.uid, // Add this field for store page compatibility
        imageUrl: '',
        imageUrls: [],
        status: 'Active',
        visibility,
        tags,
        shippingType,
        shippingCost: shippingType === 'Paid' ? shippingCost : 0,
        weight: shippingType === 'Paid' ? parseFloat(weight) || 0 : 0,
        length: shippingType === 'Paid' ? parseFloat(length) || 0 : 0,
        width: shippingType === 'Paid' ? parseFloat(width) || 0 : 0,
        height: shippingType === 'Paid' ? parseFloat(height) || 0 : 0,
        quantity: type === 'bin' ? parseInt(quantity) : 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: type === 'bin' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : null,
        endsAt: type === 'auction' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) : null,
      };
      const docRef = await addDoc(collection(db, 'listings'), listingData);
      const docId = docRef.id;
      // 2. Upload images to listingImages/{user.uid}/{docId}/{fileName}
      const storage = getStorage(app);
      const imageUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const fileName = `listingImages/${user.uid}/${docId}/image_${i}.jpg`;
        const storageRef = ref(storage, fileName);
        const res = await fetch(photos[i]);
        const blob = await res.blob();
        // Use uploadBytesResumable for reliability
        await new Promise<void>((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, blob);
          uploadTask.on('state_changed', null, reject, async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              imageUrls.push(url);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        });
      }
      // 3. Update Firestore doc with image URLs
      await updateDoc(doc(db, 'listings', docId), {
        imageUrls,
        imageUrl: imageUrls[0] || '',
        updatedAt: serverTimestamp(),
      });
      localStorage.removeItem('hobbydork_listing_draft');
      toast({ title: "Item Listed!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Listing Failed', description: error.message });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-zinc-950 py-3">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mandatory 2-Day Shipping Required</p>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <header className="mb-12 flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
              <Zap className="w-3 h-3" /> Seller Tool
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter text-primary leading-none">New Listing</h1>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground bg-muted px-3 py-1.5 rounded-full mb-2">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Saved {lastSaved}
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            {/* Photo Section */}
            <section className="space-y-6">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Photos & Visuals</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className={
                      cn(
                        "relative aspect-square rounded-2xl overflow-hidden border-2 border-accent bg-white/80 dark:bg-zinc-900/80 shadow-lg group flex items-center justify-center transition-all duration-200 hover:scale-[1.04] hover:border-primary hover:shadow-2xl"
                      )
                    }
                  >
                    <Image 
                      src={p} 
                      alt="Preview" 
                      fill 
                      style={{ background: 'transparent', filter: 'none', objectFit: 'contain' }} // Show full image, no crop, no grayscale
                    />
                    <button
                      type="button"
                      title="Remove photo"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label htmlFor="listing-photo-upload" className="aspect-square border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group" title="Upload photos">
                  <Plus className="w-8 h-8 text-zinc-400 group-hover:text-accent transition-colors" />
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Upload</span>
                  <input id="listing-photo-upload" name="photos" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <button type="button" title="Use camera" aria-label="Use camera" onClick={() => setShowCamera(true)} className="aspect-square border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all group">
                  <Monitor className="w-8 h-8 text-zinc-400 group-hover:text-accent transition-colors" />
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Live Cam</span>
                </button>
              </div>
              {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
                  <div className="relative max-w-2xl w-full">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-[2.5rem] border-4 border-white/10 shadow-2xl" />
                    <button onClick={() => setShowCamera(false)} className="absolute -top-12 right-0 text-white hover:text-accent transition-colors" title="Close camera">
                      <X className="w-8 h-8" />
                    </button>
                  </div>
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="max-w-md mt-8 border-2">
                      <AlertTitle className="font-black uppercase text-xs">Camera Required</AlertTitle>
                      <AlertDescription className="text-xs font-medium">Please allow camera access in your browser settings to use the Live Cam protocol.</AlertDescription>
                    </Alert>
                  )}
                  <div className="mt-10 flex gap-6">
                    <Button type="button" onClick={capturePhoto} disabled={!hasCameraPermission} className="h-20 px-12 bg-white text-zinc-950 font-black uppercase text-lg rounded-full shadow-2xl transition-all active:scale-95">Snap Protocol</Button>
                  </div>
                </div>
              )}
            </section>

            {/* Form Fields */}
            <section className="space-y-8 bg-muted/40 dark:bg-card/60 p-8 rounded-[2rem] border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="listing-title-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                <Input id="listing-title-input" name="title" value={title} onChange={e => setTitle(e.target.value)} required className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-bold text-lg text-zinc-950 focus-visible:ring-accent shadow-sm placeholder:text-zinc-400" placeholder="e.g. 1968 Omega Speedmaster" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="listing-category-select" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="listing-category-select" className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-black text-zinc-950 shadow-sm"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200">{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold uppercase text-[10px] tracking-widest">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listing-condition-select" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Condition</Label>
                  <Select value={condition} onValueChange={v => setCondition(v as any)}>
                    <SelectTrigger id="listing-condition-select" className="h-14 rounded-xl border-2 border-zinc-200 bg-white font-black text-zinc-950 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200"><SelectItem value="New" className="font-bold">NEW</SelectItem><SelectItem value="Like New" className="font-bold">LIKE NEW</SelectItem><SelectItem value="Used" className="font-bold">USED</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Format</Label>
                  <RadioGroup value={type} onValueChange={setType} className="flex gap-3">
                    <Label htmlFor="type-bin-radio" className={cn("flex-1 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", type === 'bin' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                      <RadioGroupItem value="bin" id="type-bin-radio" className="sr-only" /> 
                      Buy It Now
                    </Label>
                    <Label htmlFor="type-auc-radio" className={cn("flex-1 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase transition-all", type === 'auction' ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600")}>
                      <RadioGroupItem value="auction" id="type-auc-radio" className="sr-only" /> 
                      Auction
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listing-price-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{type === 'bin' ? 'Price' : 'Starting Bid'}</Label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-accent font-black text-lg">$</span>
                    <Input id="listing-price-input" name="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required className="h-14 pl-10 rounded-xl border-2 border-zinc-200 bg-white font-black text-xl text-zinc-950 focus-visible:ring-accent shadow-sm" placeholder="0.00" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-desc-textarea" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea id="listing-desc-textarea" name="description" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[150px] rounded-xl border-2 border-zinc-200 bg-white font-medium text-base text-zinc-950 focus-visible:ring-accent shadow-sm placeholder:text-zinc-400" placeholder="Detail the condition, provenance, and why this is a grail..." />
              </div>
            </section>

            {/* Shipping Section */}
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

              {shippingType === 'Paid' && (
                <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="weight-input-field" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Weight (lbs)</Label>
                      <Input id="weight-input-field" name="weight" type="number" className="h-14 rounded-xl border-2 border-zinc-200 bg-white text-zinc-950 font-black shadow-sm" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Box Dimensions (LxWxH)</Label>
                      <div className="flex gap-2">
                        <Input id="length-input-field" name="length" placeholder="L" title="Length" aria-label="Length" className="h-14 border-2 border-zinc-200 bg-white rounded-xl font-black text-zinc-950 text-center shadow-sm" value={length} onChange={e => setLength(e.target.value)} />
                        <Input id="width-input-field" name="width" placeholder="W" title="Width" aria-label="Width" className="h-14 border-2 border-zinc-200 bg-white rounded-xl font-black text-zinc-950 text-center shadow-sm" value={width} onChange={e => setWidth(e.target.value)} />
                        <Input id="height-input-field" name="height" placeholder="H" title="Height" aria-label="Height" className="h-14 border-2 border-zinc-200 bg-white rounded-xl font-black text-zinc-950 text-center shadow-sm" value={height} onChange={e => setHeight(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <Button type="button" onClick={calculateShipping} disabled={isCalculatingShipping} className="w-full h-14 bg-zinc-950 text-white border border-white/10 font-black uppercase rounded-xl shadow-xl hover:bg-zinc-900 transition-all active:scale-95">
                    {isCalculatingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calculator className="w-4 h-4 mr-2" /> Calculate Delivery Cost</>}
                  </Button>
                  {shippingCost > 0 && (
                    <div className="p-6 bg-accent/5 border-2 border-accent/20 rounded-2xl text-center">
                      <p className="text-xs font-black uppercase tracking-widest text-accent italic">Flat Rate Protocol Fee: ${shippingCost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            <Button type="submit" disabled={isSubmitting} title="Launch Listing" className="w-full h-24 bg-white text-zinc-950 hover:bg-zinc-100 font-black text-3xl rounded-[2rem] shadow-2xl uppercase italic tracking-tighter transition-all active:scale-95 group">
              {isSubmitting ? <Loader2 className="animate-spin" /> : (
                <div className="flex items-center justify-center gap-4">
                  Publish to Catalog
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </div>
              )}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-muted/40 dark:bg-card/60 text-foreground dark:text-white p-8 rounded-[2.5rem] shadow-2xl border border-border dark:border-white/5 sticky top-24">
              <h3 className="font-headline font-black text-xl mb-8 uppercase italic tracking-tighter flex items-center gap-2 text-accent pb-4"><Sparkles className="w-5 h-5" /> Manifest Policy</h3>
              <ul className="space-y-10">
                <li className="space-y-3">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest"><Truck className="w-4 h-4" /> 48-Hour Protocol</div>
                  <p className="text-[11px] font-bold text-muted-foreground dark:text-zinc-500 leading-relaxed uppercase tracking-tight">
                    Packages must be scanned by carrier within 2 business days. Late shipments trigger automatic buyer protection.
                  </p>
                </li>
                <li className="space-y-3">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest"><ShieldCheck className="w-4 h-4" /> Visual Integrity</div>
                  <p className="text-[11px] font-bold text-muted-foreground dark:text-zinc-500 leading-relaxed uppercase tracking-tight">
                    Represent condition accurately. Mismatched visual assets result in tier downgrades and escrow holds.
                  </p>
                </li>
              </ul>
              <div className="mt-12 pt-6 border-t border-border dark:border-white/5">
                <p className="text-[9px] font-black text-muted-foreground dark:text-zinc-600 uppercase tracking-widest text-center">hobbydork seller protocol v2.4</p>
              </div>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
