'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CATEGORIES } from '@/lib/mock-data';
import { Camera, Sparkles, Loader2, X, Truck, Zap, Monitor, ShieldCheck, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { cn, filterProfanity } from '@/lib/utils';

export default function CreateListing() {
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { photos, setPhotos, handlePhotoUpload, removePhoto } = usePhotoUpload();
  const [showCamera, setShowCamera] = useState(false);
  
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

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Camera Access Denied' });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setPhotos(prev => [...prev, canvas.toDataURL('image/jpeg')]);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !title || !price || !category) return;

    if (!profile?.isSeller || profile?.status !== 'ACTIVE') {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'Only active verified sellers can list items.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedTitle = filterProfanity(title);
      const sanitizedDescription = filterProfanity(description);
      
      const storage = getStorage();
      const imageUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const fileName = `listings/${user.uid}/${Date.now()}_${i}.jpg`;
        const storageRef = ref(storage, fileName);
        const res = await fetch(photos[i]);
        const blob = await res.blob();
        await uploadBytes(storageRef, blob);
        imageUrls.push(await getDownloadURL(storageRef));
      }

      const listingData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: parseFloat(price),
        category,
        condition,
        type: type === 'bin' ? 'Buy It Now' : 'Auction',
        sellerName: profile?.username || 'Collector',
        listingSellerId: user.uid,
        imageUrl: imageUrls[0] || '',
        imageUrls,
        status: 'Active',
        visibility,
        tags,
        shippingType,
        quantity: type === 'bin' ? parseInt(quantity) : 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: type === 'bin' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : null,
        endsAt: type === 'auction' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) : null,
      };

      await addDoc(collection(db, 'listings'), listingData);
      toast({ title: "Item Listed!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Listing Failed', description: error.message });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-red-600 text-white py-3">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="text-xs font-black uppercase tracking-tight">Mandatory 2-Day Shipping Required For All Listings</p>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <header className="mb-10 space-y-1">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <Zap className="w-3 h-3" /> Professional Tools
          </div>
          <h1 className="text-2xl md:text-4xl font-headline font-black uppercase italic tracking-tighter">New Listing</h1>
        </header>
        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            <section className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest">Photos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 group">
                    <Image src={p} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100" title="Remove photo"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <label className="aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5">
                  <Camera className="w-8 h-8 text-muted-foreground" /><span className="text-[10px] font-black uppercase">Upload</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <button type="button" onClick={startCamera} className="aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5">
                  <Monitor className="w-8 h-8 text-muted-foreground" /><span className="text-[10px] font-black uppercase">Live Cam</span>
                </button>
              </div>
              {showCamera && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                  <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[70vh] rounded-3xl" />
                  <div className="mt-8 flex gap-4">
                    <Button type="button" onClick={capturePhoto} className="h-16 px-10 bg-white text-black font-black uppercase rounded-full">Capture</Button>
                    <Button type="button" onClick={stopCamera} variant="outline" className="h-16 w-16 p-0 rounded-full border-white/20 text-white"><X className="w-8 h-8" /></Button>
                  </div>
                </div>
              )}
            </section>
            <section className="space-y-6">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required className="h-14 rounded-xl border-2 font-bold" placeholder="Asset name..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Category</Label><Select value={category} onValueChange={setCategory} required><SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Condition</Label><Select value={condition} onValueChange={v => setCondition(v as any)}><SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Like New">Like New</SelectItem><SelectItem value="Used">Used</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Format</Label>
                  <RadioGroup value={type} onValueChange={setType} className="flex gap-2">
                    <Label htmlFor="type-bin" className={cn("flex-1 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase", type === 'bin' ? "bg-primary text-white" : "hover:bg-muted")}><RadioGroupItem value="bin" id="type-bin" className="sr-only" /> Buy It Now</Label>
                    <Label htmlFor="type-auc" className={cn("flex-1 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer font-black text-[10px] uppercase", type === 'auction' ? "bg-primary text-white" : "hover:bg-muted")}><RadioGroupItem value="auction" id="type-auc" className="sr-only" /> Auction</Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">{type === 'bin' ? 'Price' : 'Starting Bid'}</Label><Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required className="h-14 rounded-xl border-2 font-bold" placeholder="0.00" /></div>
              </div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[150px] rounded-xl border-2" placeholder="Tell the story of this asset..." /></div>
            </section>
            <Button type="submit" disabled={isSubmitting} className="w-full h-20 bg-accent text-white font-black text-2xl rounded-2xl shadow-xl uppercase italic tracking-tighter">{isSubmitting ? <Loader2 className="animate-spin" /> : "Launch Listing"}</Button>
          </div>
          <aside className="space-y-6">
            <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
              <h3 className="font-headline font-black text-xl mb-6 uppercase italic flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" /> Seller Protocol</h3>
              <ul className="space-y-8">
                <li className="space-y-2"><div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase"><Truck className="w-3 h-3" /> Shipping</div><p className="text-[11px] font-bold text-white/60 leading-relaxed">Orders must be received by carrier within 2 business days. Weekends and federal holidays excluded.</p></li>
                <li className="space-y-2"><div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase"><ShieldCheck className="w-3 h-3" /> Authenticity</div><p className="text-[11px] font-bold text-white/60 leading-relaxed">Misleading descriptions or fake items result in permanent suspension.</p></li>
              </ul>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}