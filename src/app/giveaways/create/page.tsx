'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Sparkles, 
  Loader2, 
  X, 
  Gift, 
  Zap, 
  ArrowLeft,
  Monitor,
  ShieldCheck,
  Users,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Link from 'next/link';
import { filterProfanity } from '@/lib/utils';

export default function CreateGiveaway() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeValue, setPrizeValue] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const isDemo = typeof window !== 'undefined' && localStorage.getItem('hobbydork_demo_mode') === 'true';
  
  // Rule Check Alignment: emailVerified == true && status == ACTIVE
  const isVerified = !!(profile?.emailVerified && profile?.status === 'ACTIVE');
  // Rule Check Alignment: isSeller == true
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
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Access Denied' });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !title || !prizeValue || !endsAt || !photo) return;

    if (!isVerified || !isSeller) {
      toast({ variant: 'destructive', title: "Security Gate Triggered", description: "You must be a verified dealer to host drops." });
      return;
    }

    setIsSubmitting(true);

    const sanitizedTitle = filterProfanity(title);
    const sanitizedDescription = filterProfanity(description);

    const dropData = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      prizeValue: parseFloat(prizeValue),
      endsAt: new Date(endsAt),
      imageUrl: photo,
      seller: profile?.username || user.uid,
      sellerId: user.uid, // Security Rules: request.resource.data.sellerId == uid()
      sellerName: profile?.username || 'Collector',
      status: 'Active',
      entriesCount: 0,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(db, 'giveaways'), dropData)
      .then(() => {
        toast({ title: 'Live Drop Launched!' });
        router.push('/dashboard');
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'giveaways',
          operation: 'create',
          requestResourceData: dropData,
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
          <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Account Restricted</h1>
          <p className="text-muted-foreground font-medium">Your current status prevents you from hosting community drops.</p>
          <Button asChild variant="outline" className="h-14 px-10 rounded-xl font-black uppercase">
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
          <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Verify Identity</h1>
          <p className="text-muted-foreground font-medium">Email verification and an active profile are required to host live drops on hobbydork.</p>
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
          <h1 className="text-4xl font-headline font-black uppercase italic tracking-tight">Become a Dealer</h1>
          <p className="text-muted-foreground font-medium">Complete shop onboarding to unlock the community drops feature.</p>
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
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> Back to Hub</Link>
        <header className="mb-10 space-y-2">
          <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase mb-2"><Zap className="w-3 h-3" /> Seller Tool</div>
          <h1 className="text-4xl font-headline font-black italic uppercase tracking-tighter">Launch Live Drop</h1>
          <p className="text-muted-foreground font-medium">Create a community giveaway to reward your followers.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            <section className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-primary">Prize Photo</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photo ? (
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-zinc-100 shadow-2xl group">
                    <Image src={photo} alt="Prize" fill className="object-cover" />
                    <button type="button" title="Remove prize photo" aria-label="Remove prize photo" onClick={() => setPhoto(null)} className="absolute top-4 right-4 bg-zinc-950/50 text-white rounded-full p-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="w-4 h-4" /></button>
                  </div>
                ) : showCamera ? (
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black border-4 border-accent shadow-2xl">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                      <Button type="button" onClick={capturePhoto} className="bg-white text-zinc-950 rounded-full h-14 px-8 font-black uppercase tracking-widest">Snap Photo</Button>
                      <Button type="button" variant="outline" onClick={stopCamera} className="bg-white/10 text-white border-white/20 backdrop-blur-md rounded-full h-14 w-14 p-0"><X className="w-6 h-6" /></Button>
                    </div>
                    {hasCameraPermission === false && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80"><Alert variant="destructive"><AlertTitle>Camera Required</AlertTitle></Alert></div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="aspect-video border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent transition-all group">
                      <Camera className="w-10 h-10 text-muted-foreground" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <button type="button" onClick={startCamera} className="aspect-video border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent transition-all group">
                      <Monitor className="w-10 h-10 text-muted-foreground" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Cam</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest">Prize Title</Label>
                <Input id="title" placeholder="e.g. 1977 Star Wars Series 1 Wax Pack" className="h-14 rounded-2xl border-2 font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-xs font-black uppercase tracking-widest">Estimated Value ($)</Label>
                  <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">$</span><Input id="value" type="number" placeholder="0.00" className="pl-10 h-14 rounded-2xl border-2 text-xl font-black" value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="endsAt" className="text-xs font-black uppercase tracking-widest">End Date & Time</Label><Input id="endsAt" type="datetime-local" className="h-14 rounded-2xl border-2 font-bold" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="description" className="text-xs font-black uppercase tracking-widest">Description</Label><Textarea id="description" placeholder="Why is this a must-have?" className="min-h-[150px] rounded-2xl border-2 font-medium" value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-white font-black h-20 text-2xl rounded-2xl shadow-xl shadow-accent/20 uppercase italic tracking-tighter">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Launch Live Drop"}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
              <h3 className="font-headline font-black text-xl mb-6 uppercase italic tracking-tighter flex items-center gap-2"><Gift className="w-5 h-5 text-accent" /> Drop Policy</h3>
              <ul className="space-y-8">
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <Users className="w-3 h-3" /> Follower Requirement
                  </div>
                  <p className="text-xs font-bold leading-relaxed text-white/70">
                    Only collectors following your shop can enter. Use drops to reward your most loyal fans and grow your reach.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <ShieldCheck className="w-3 h-3" /> Fair Play
                  </div>
                  <p className="text-xs font-bold leading-relaxed text-white/70">
                    Winners are selected randomly by the system. Sellers are expected to ship prizes within the standard 2-business-day window.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase">
                    <Sparkles className="w-3 h-3" /> Engagement Tip
                  </div>
                  <p className="text-xs font-bold leading-relaxed text-white/70">
                    Announce your drop in the Community Chat 1 hour before launching to maximize entry volume.
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
