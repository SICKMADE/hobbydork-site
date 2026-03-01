'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CATEGORIES } from '@/lib/mock-data';
import { Camera, Sparkles, Loader2, X, Truck, Calculator, Zap, Monitor, Info, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { suggestListingDetails } from '@/ai/flows/ai-powered-listing-description-and-tags';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn, filterProfanity } from '@/lib/utils';
import Link from 'next/link';

export default function CreateListing() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('bin');
  const [tags, setTags] = useState<string[]>([]);

  const [shippingType, setShippingType] = useState<'Free' | 'Paid'>('Free');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);

  const isDemo = typeof window !== 'undefined' && localStorage.getItem('hobbydork_demo_mode') === 'true';
  
  // Security Rule Alignment: isVerified() requires emailVerified == true && status == ACTIVE
  const isVerified = !!(profile?.emailVerified && profile?.status === 'ACTIVE');
  // Security Rule Alignment: canSell() requires isVerified() && userIsSeller()
  const isSeller = !!(profile?.isSeller || isDemo);
  const isSuspended = profile?.status === 'BANNED' || profile?.status === 'SUSPENDED';

  useEffect(() => {
    if (!authLoading && !profileLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, profileLoading]);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg');
      setPhoto(dataUri);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: "File Too Large" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runAiAssistant = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const result = await suggestListingDetails({ photoDataUri: photo });
      setDescription(result.description);
      setTags(result.tags);
      toast({ title: 'Listing suggestions applied.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Suggestions failed.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = async () => {
    if (!weight || !length || !width || !height) return;
    setIsCalculatingShipping(true);
    setTimeout(() => {
      const cost = 5 + (parseFloat(weight) * 0.75) + ((parseFloat(length) * parseFloat(width) * parseFloat(height)) / 166);
      setCalculatedShippingCost(Math.round(cost * 100) / 100);
      setIsCalculatingShipping(false);
      toast({ title: 'Estimated shipping cost calculated.' });
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !title || !price || !category) return;

    if (!isVerified || !isSeller) {
      toast({ variant: 'destructive', title: "Security Gate Triggered", description: "You do not meet the verified dealer requirements." });
      return;
    }

    setIsSubmitting(true);

    const sanitizedTitle = filterProfanity(title);
    const sanitizedDescription = filterProfanity(description);
    
    const listingData = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      price: parseFloat(price),
      category,
      type: type === 'bin' ? 'Buy It Now' : 'Auction',
      seller: profile?.username || user.uid,
      sellerId: user.uid, // Required by Security Rules: request.resource.data.sellerId == uid()
      sellerName: profile?.username || 'Collector',
      imageUrl: photo || '',
      status: 'Active',
      tags: tags,
      shippingType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currentBid: type === 'auction' ? parseFloat(price) : null,
      bidCount: 0,
      endsAt: type === 'auction' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) : null 
    };

    addDoc(collection(db, 'listings'), listingData)
      .then(() => {
        toast({ title: 'Item Listed!', description: 'Your item is now live in the catalog.' });
        router.push('/');
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'listings',
          operation: 'create',
          requestResourceData: listingData,
        } satisfies SecurityRuleContext));
        setIsSubmitting(false);
      });
  };

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-32 text-center max-w-lg space-y-8">
          <div className="w-20 h-20 bg-red-100 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Account Restricted</h1>
            <p className="text-muted-foreground font-medium">Your account status prevents you from creating new listings. Contact support for details.</p>
          </div>
          <Button asChild variant="outline" className="h-14 px-10 rounded-xl font-black uppercase tracking-widest">
            <Link href="/help">Help Center</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-32 text-center max-w-lg space-y-8">
          <div className="w-20 h-20 bg-accent/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Verify Identity</h1>
            <p className="text-muted-foreground font-medium">To follow Security Rules, all sellers must have a verified email address and an active profile.</p>
          </div>
          <Button asChild className="h-14 px-10 rounded-xl font-black uppercase tracking-widest bg-accent text-white shadow-xl">
            <Link href="/verify-email">Go to Verification</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-32 text-center max-w-lg space-y-8">
          <div className="w-20 h-20 bg-accent/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <Zap className="w-10 h-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Become a Dealer</h1>
            <p className="text-muted-foreground font-medium">You need to complete shop onboarding before you can list items for sale.</p>
          </div>
          <Button asChild className="h-14 px-10 rounded-xl font-black uppercase tracking-widest bg-accent text-white shadow-xl">
            <Link href="/seller/onboarding">Start Onboarding</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="mb-10 space-y-2">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
            <Zap className="w-3 h-3" /> Seller Tools
          </div>
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Create New Listing</h1>
          <p className="text-muted-foreground font-medium">List your items and reach collectors instantly.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            <section className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest">Item Photos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photo ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-zinc-100 shadow-2xl group">
                    <Image src={photo} alt="Preview" fill className="object-cover" />
                    <button type="button" title="Remove photo" aria-label="Remove photo" onClick={() => setPhoto(null)} className="absolute top-4 right-4 bg-zinc-950/50 text-white rounded-full p-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="w-4 h-4" /></button>
                  </div>
                ) : showCamera ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border-4 border-accent shadow-2xl">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                      <Button type="button" onClick={capturePhoto} className="bg-white text-zinc-950 hover:bg-white/90 rounded-full h-14 px-8 font-black uppercase tracking-widest">Snap Photo</Button>
                      <Button type="button" variant="outline" onClick={stopCamera} className="bg-white/10 text-white border-white/20 backdrop-blur-md rounded-full h-14 w-14 p-0"><X className="w-6 h-6" /></Button>
                    </div>
                    {hasCameraPermission === false && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-black/80">
                        <Alert variant="destructive" className="bg-red-600 border-none text-white">
                          <AlertTitle>Camera Access Required</AlertTitle>
                          <AlertDescription>Please allow camera access to take photos of your items.</AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                      <Camera className="w-8 h-8 text-muted-foreground group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <button type="button" onClick={startCamera} className="aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                      <Monitor className="w-8 h-8 text-muted-foreground group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Cam</span>
                    </button>
                  </div>
                )}
              </div>
              {photo && (
                <Button type="button" variant="outline" className="w-full h-14 gap-2 border-2 border-accent text-accent hover:bg-accent/5 rounded-xl font-black shadow-lg" onClick={runAiAssistant} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Use AI Suggestions
                </Button>
              )}
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest">Listing Title</Label>
                <Input id="title" placeholder="e.g. 1968 Omega Speedmaster" className="h-14 rounded-xl border-2 font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">Category</Label>
                  <Select onValueChange={setCategory} value={category} required>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">Pricing Model</Label>
                  <RadioGroup defaultValue="bin" className="flex gap-2" onValueChange={setType}>
                    <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors"><RadioGroupItem value="bin" id="bin" /><Label htmlFor="bin" className="cursor-pointer font-bold">Buy It Now</Label></div>
                    <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors"><RadioGroupItem value="auction" id="auction" /><Label htmlFor="auction" className="cursor-pointer font-bold">Auction</Label></div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest">{type === 'bin' ? 'Price' : 'Starting Bid'}</Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">$</span>
                  <Input id="price" type="number" placeholder="0.00" className="pl-10 h-16 rounded-xl border-2 text-2xl font-black" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest">Description</Label>
                <Textarea id="description" placeholder="Tell buyers about the history and condition..." className="min-h-[150px] rounded-xl border-2 font-medium" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </section>

            <section className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-xl"><Truck className="w-6 h-6 text-accent" /></div>
                <div><h3 className="text-xl font-black uppercase tracking-tighter">Shipping</h3><p className="text-xs text-muted-foreground font-bold">Manage delivery options.</p></div>
              </div>
              <RadioGroup defaultValue="Free" className="grid grid-cols-2 gap-4" onValueChange={(val) => setShippingType(val as 'Free' | 'Paid')}>
                {['Free', 'Paid'].map(t => (
                  <div key={t} className={cn("flex flex-col gap-2 p-6 rounded-xl border-2 transition-all cursor-pointer", shippingType === t ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                    <RadioGroupItem value={t} id={`ship-${t}`} className="sr-only" />
                    <Label htmlFor={`ship-${t}`} className="cursor-pointer flex flex-col gap-1">
                      <span className="font-black uppercase tracking-widest text-xs">{t} Shipping</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {shippingType === 'Paid' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Weight (lbs)</Label><Input type="number" className="h-12 rounded-xl border-2" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Dimensions</Label>
                      <div className="flex gap-2">
                        <Input placeholder="L" className="h-12 border-2" value={length} onChange={(e) => setLength(e.target.value)} />
                        <Input placeholder="W" className="h-12 border-2" value={width} onChange={(e) => setWidth(e.target.value)} />
                        <Input placeholder="H" className="h-12 border-2" value={height} onChange={(e) => setHeight(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <Button type="button" onClick={calculateShipping} disabled={isCalculatingShipping} className="w-full bg-zinc-950 text-white font-black rounded-xl h-14">
                    {isCalculatingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                    Calculate Shipping Rate
                  </Button>
                </div>
              )}
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-white font-black h-20 text-2xl rounded-2xl shadow-xl transition-all active:scale-95 uppercase italic tracking-tighter">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "List Item Now"}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-primary text-white p-8 rounded-2xl shadow-2xl sticky top-24">
              <h3 className="font-headline font-black text-xl mb-6 uppercase tracking-tighter flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" /> Seller Guide</h3>
              <ul className="space-y-8">
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <Truck className="w-3 h-3" /> Shipping Policy
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    You <span className="text-accent">must ship items within 2 business days</span> of a confirmed sale. Prompt shipping is the #1 factor in Trust Board rankings.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <ShieldCheck className="w-3 h-3" /> Authenticity
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    Misleading listings lead to immediate account suspension. Ensure your photos capture any defects or restoration.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <Info className="w-3 h-3" /> AI Suggestions
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    Upload a high-quality photo to unlock AI-generated tags and descriptions that help your item appear in search.
                  </p>
                </li>
              </ul>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
