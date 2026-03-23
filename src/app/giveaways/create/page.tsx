'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  Loader2, 
  X, 
  Gift, 
  Zap, 
  ArrowLeft,
  Monitor,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { filterProfanity } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CreateGiveaway() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeValue, setPrizeValue] = useState('');
  const [endsAt, setEndsAt] = useState('');

  useEffect(() => {
    const savedDraft = localStorage.getItem('hobbydork_giveaway_draft');
    if (savedDraft) {
      try {
        const data = JSON.parse(savedDraft);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPrizeValue(data.prizeValue || '');
        setEndsAt(data.endsAt || '');
        toast({ title: "Draft Restored", description: "Unsaved changes recovered." });
      } catch (e) {
        console.error("Draft recovery failed");
      }
    }
    setIsDraftLoaded(true);
  }, [toast]);

  useEffect(() => {
    if (!isDraftLoaded) return;
    const timer = setTimeout(() => {
      const draft = { title, description, prizeValue, endsAt };
      localStorage.setItem('hobbydork_giveaway_draft', JSON.stringify(draft));
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, description, prizeValue, endsAt, isDraftLoaded]);

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
      setPhoto(canvas.toDataURL('image/jpeg'));
      setShowCamera(false);
    }
  };

  const uploadPhotoToStorage = async (dataUri: string): Promise<string> => {
    const storage = getStorage();
    const fileName = `giveawayImages/${user!.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    const response = await fetch(dataUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !title || !prizeValue || !endsAt || !photo) return;

    if (!profile?.isSeller || profile?.status !== 'ACTIVE') {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'Only active verified sellers can launch giveaways.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedTitle = filterProfanity(title);
      const sanitizedDescription = filterProfanity(description);
      const imageUrl = await uploadPhotoToStorage(photo);

      const dropData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        prizeValue: parseFloat(prizeValue),
        endsAt: Timestamp.fromDate(new Date(endsAt)),
        imageUrl: imageUrl,
        seller: user.uid,
        sellerId: user.uid, 
        sellerName: profile?.username || 'Collector',
        status: 'Active',
        entriesCount: 0,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'giveaways'), dropData);
      localStorage.removeItem('hobbydork_giveaway_draft');
      toast({ title: 'Live Drop Launched!' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Launch Failed', description: getFriendlyErrorMessage(error) });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> Back</Link>
        
        <header className="mb-10 flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-black tracking-widest text-[10px] uppercase mb-2"><Zap className="w-3 h-3" /> Seller Tool</div>
            <h1 className="text-4xl font-headline font-black italic uppercase tracking-tighter text-primary leading-none">Launch Live Drop</h1>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground bg-muted px-3 py-1.5 rounded-full mb-2">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Draft Saved {lastSaved}
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            <section className="bg-zinc-900/30 p-8 rounded-2xl border-2 border-dashed border-white/5 space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-primary">Prize Photo</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photo ? (
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-zinc-100 shadow-2xl group">
                    <Image src={photo} alt="Prize" fill className="object-cover" />
                    <button type="button" aria-label="Remove photo" title="Remove photo" onClick={() => setPhoto(null)} className="absolute top-4 right-4 bg-zinc-950/50 text-white rounded-full p-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="w-4 h-4" /></button>
                  </div>
                ) : showCamera ? (
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black border-4 border-primary shadow-2xl">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                      <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-20">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                      </Alert>
                    )}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                      <Button type="button" onClick={capturePhoto} disabled={!hasCameraPermission} className="bg-white text-zinc-950 rounded-full h-14 px-8 font-black uppercase tracking-widest">Snap Photo</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCamera(false)} className="bg-white/10 text-white border-white/20 backdrop-blur-md rounded-full h-14 w-14 p-0"><X className="w-6 h-6" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <label htmlFor="prize-photo-upload" className="aspect-video border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-all group">
                      <Camera className="w-10 h-10 text-muted-foreground" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload</span>
                      <input id="prize-photo-upload" type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    <button type="button" onClick={() => setShowCamera(true)} className="aspect-video border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-all group">
                      <Monitor className="w-10 h-10 text-muted-foreground" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Cam</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6 bg-zinc-900/30 p-8 rounded-2xl border-2 border-dashed border-white/5">
              <div className="space-y-2">
                <Label htmlFor="prize-title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prize Title</Label>
                <Input id="prize-title" placeholder="e.g. 1977 Star Wars Series 1 Wax Pack" className="h-14 rounded-2xl border-2 border-zinc-200 bg-white font-bold text-zinc-950 focus-visible:ring-primary shadow-sm placeholder:text-zinc-400" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prize-value" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estimated Value ($)</Label>
                  <Input id="prize-value" type="number" placeholder="0.00" className="h-14 rounded-2xl border-2 border-zinc-200 bg-white text-xl font-black text-zinc-950 focus-visible:ring-primary shadow-sm" value={prizeValue} onChange={e => setPrizeValue(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize-ends-at" className="text-xs font-black uppercase tracking-widest text-muted-foreground">End Date & Time</Label>
                  <Input id="prize-ends-at" type="datetime-local" className="h-14 rounded-2xl border-2 border-zinc-200 bg-white font-bold text-zinc-950 focus-visible:ring-primary shadow-sm" value={endsAt} onChange={e => setEndsAt(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize-description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Textarea id="prize-description" placeholder="Why is this a must-have?" className="min-h-[150px] rounded-2xl border-2 border-zinc-200 bg-white text-zinc-950 font-medium focus-visible:ring-primary shadow-sm placeholder:text-zinc-400" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black h-20 text-2xl rounded-2xl shadow-xl uppercase italic tracking-tighter">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Launch Live Drop"}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
              <h3 className="font-headline font-black text-xl mb-6 uppercase italic tracking-tighter flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Drop Policy</h3>
              <ul className="space-y-8">
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase">
                    <ShieldCheck className="w-3 h-3" /> Fair Play
                  </div>
                  <p className="text-[11px] font-bold leading-relaxed text-white/60">
                    Winners are selected randomly. Sellers must ship prizes within the 2-day window.
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
