
'use client';
import { ItemDetailsSection } from '@/components/ItemDetailsSection';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAiGrading } from '@/ai/grading/useAiGrading';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CATEGORIES, GRADING_OPTIONS } from '@/lib/mock-data';
import { Camera, Sparkles, Loader2, X, Truck, Zap, Monitor, Info, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { ShippingSection } from '@/components/ShippingSection';
import { TagSection } from '@/components/TagSection';
import { suggestListingDetails } from '@/ai/flows/ai-powered-listing-description-and-tags';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn, filterProfanity } from '@/lib/utils';
import Link from 'next/link';

export default function CreateListing() {
      // AI Grading hook

    // --- GLOBAL STATE & PROFILE LOGIC ---
    const db = useFirestore();
    const { user, isUserLoading: authLoading } = useUser();
    const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
    const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('hobbydork_demo_mode') === 'true';
    const isVerified = !!(profile?.emailVerified && profile?.status === 'ACTIVE');
    const isSeller = !!(profile?.isSeller || isDemo);
    const isSuspended = profile?.status === 'BANNED' || profile?.status === 'SUSPENDED';
  // ...existing code...
  // Profile and account status logic
    // Form state hooks
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState('bin');
    const [condition, setCondition] = useState<'New' | 'Like New' | 'Used'>('Used');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [visibility, setVisibility] = useState<'Visible' | 'Invisible'>('Visible');
    const [isGraded, setIsGraded] = useState(false);
    const [gradingCompany, setGradingCompany] = useState('');
    const [gradingGrade, setGradingGrade] = useState('');
    const [shippingType, setShippingType] = useState<'Free' | 'Paid'>('Free');
    const [weight, setWeight] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);
    const [quantity, setQuantity] = useState('1');
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
    const [draftSaveTime, setDraftSaveTime] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [formLoading, setFormLoading] = useState(false);
  // AI Grading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const {
    photos,
    setPhotos,
    loading: photoLoading,
    handlePhotoUpload,
    removePhoto,
  } = usePhotoUpload();
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
// ...existing code...
// Place the ItemDetailsSection usage after all useState hooks
  useEffect(() => {
    if (typeof window === 'undefined' || !isDraftLoaded) return;

    const timer = setTimeout(async () => {
      const draft = {
        title,
        description,
        category,
        price,
        type,
        condition,
        tags,
        visibility,
        shippingType,
        weight,
        length,
        width,
        height,
        isGraded,
        gradingCompany,
        gradingGrade,
        quantity,
        timestamp: new Date().toISOString()
      };

      try {
        localStorage.setItem('listing_draft', JSON.stringify(draft));

        if (user && db) {
          const draftRef = doc(db, 'users', user.uid, 'drafts', 'listing-create');
          await setDoc(draftRef, {
            ...draft,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        setDraftSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [title, description, category, price, type, condition, tags, visibility, shippingType, weight, length, width, height, isGraded, gradingCompany, gradingGrade, quantity, user, db, isDraftLoaded]);

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
      setPhotos(prev => [...prev, dataUri]);
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



  const uploadPhotoToStorage = async (photoDataUri: string, idx: number): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    try {
      const storage = getStorage();
      const fileName = `listings/${user.uid}/${Date.now()}_${idx}.jpg`;
      const storageRef = ref(storage, fileName);
      // Convert data URL to Blob
      const response = await fetch(photoDataUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image to storage');
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

    try {
      const sanitizedTitle = filterProfanity(title);
      const sanitizedDescription = filterProfanity(description);
      // Upload all images to Storage if any exist
      let imageUrls: string[] = [];
      if (photos.length) {
        for (let i = 0; i < photos.length; i++) {
          const url = await uploadPhotoToStorage(photos[i], i);
          imageUrls.push(url);
        }
      }
      const listingData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: parseFloat(price),
        category,
        condition, // Now saved
        type: type === 'bin' ? 'Buy It Now' : 'Auction',
        seller: profile?.username || user.uid,
        sellerId: user.uid,
        sellerName: profile?.username || 'Collector',
        imageUrls: imageUrls,
        status: 'Active',
        visibility: visibility,
        tags: tags,
        shippingType,
        weight: shippingType === 'Paid' ? parseFloat(weight) || null : null, // Now saved
        length: shippingType === 'Paid' ? parseFloat(length) || null : null, // Now saved
        width: shippingType === 'Paid' ? parseFloat(width) || null : null, // Now saved
        height: shippingType === 'Paid' ? parseFloat(height) || null : null, // Now saved
        shippingCost: calculatedShippingCost || null, // Now saved
        isGraded: isGraded,
        gradingCompany: isGraded ? gradingCompany : null,
        gradingGrade: isGraded ? gradingGrade : null,
        quantity: type === 'bin' ? Math.max(1, parseInt(quantity) || 1) : null, // Stock tracking for Buy It Now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: type === 'bin' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : null, // 30 days for Buy It Now
        currentBid: type === 'auction' ? parseFloat(price) : null,
        bidCount: 0,
        endsAt: type === 'auction' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) : null,
        aiType: aiType || null,
        aiCondition: aiCondition || null,
      };
      addDoc(collection(db, 'listings'), listingData)
        .then(async () => {
          // Clear draft from localStorage on successful submission
          if (typeof window !== 'undefined') {
            localStorage.removeItem('listing_draft');
          }
          if (user && db) {
            const draftRef = doc(db, 'users', user.uid, 'drafts', 'listing-create');
            await setDoc(draftRef, {
              title: '',
              description: '',
              category: '',
              price: '',
              tags: [],
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
          const message = visibility === 'Invisible' 
            ? 'Saved! You can edit or publish it later from your dashboard.' 
            : 'Item Listed! Your item is now live in the catalog.';
          toast({ title: visibility === 'Invisible' ? 'Saved!' : 'Item Listed!', description: message });
          router.push(visibility === 'Invisible' ? '/dashboard' : '/');
        })
        .catch((error) => {
          toast({ 
            variant: 'destructive', 
            title: 'Listing Failed', 
            description: error?.message || 'Failed to create listing. Please try again.'
          });
          setIsSubmitting(false);
        });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error?.message || 'Failed to upload image. Please try again.'
      });
      setIsSubmitting(false);
    }
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tight">Account Restricted</h1>
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tight">Verify Identity</h1>
            <p className="text-muted-foreground font-medium">To follow Security Rules, all sellers must have a verified email address and an active profile.</p>
          </div>
          <Button asChild className="h-14 px-10 rounded-xl font-black uppercase tracking-widest bg-accent text-accent-foreground shadow-xl">
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tight">Become a Dealer</h1>
            <p className="text-muted-foreground font-medium">You need to complete shop onboarding before you can list items for sale.</p>
          </div>
          <Button asChild className="h-14 px-10 rounded-xl font-black uppercase tracking-widest bg-accent text-accent-foreground shadow-xl">
            <Link href="/seller/onboarding">Start Onboarding</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* 2-Day Shipping Policy Warning */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 border-b-4 border-red-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start gap-3 max-w-5xl mx-auto">
            <ShieldAlert className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">⚠️ Mandatory 2-Day Shipping Policy</h3>
              <p className="text-xs text-white/90 font-bold leading-relaxed">
                All items you list MUST be received by carrier within <span className="underline">2 business days</span> of payment. Creating a label is not enough—package must be scanned by USPS/UPS/FedEx. Buyers can cancel with 1-click if you're late. Late shipping = automatic penalties + tier downgrade.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="mb-10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
              <Zap className="w-3 h-3" /> Seller Tools
            </div>
            {draftSaveTime && (
              <p className="text-[9px] text-muted-foreground font-medium">Draft saved at {draftSaveTime}</p>
            )}
          </div>
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Create New Listing</h1>
          <p className="text-muted-foreground font-medium">List your items and reach collectors instantly.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            <section className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest">Item Photos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-4 border-zinc-100 shadow-2xl group">
                        <Image src={photo} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                        <button type="button" title="Remove photo" aria-label="Remove photo" onClick={() => removePhoto(idx)} className="absolute top-4 right-4 bg-zinc-950/50 text-white rounded-full p-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
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
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <button type="button" onClick={startCamera} className="aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                      <Monitor className="w-8 h-8 text-muted-foreground group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Cam</span>
                    </button>
                  </div>
                )}
              </div>
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
                  <Label className="text-xs font-black uppercase tracking-widest">Condition</Label>
                  <Select onValueChange={(val) => setCondition(val as 'New' | 'Like New' | 'Used')} value={condition}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional Grading Section - Show if category has grading options */}
              {GRADING_OPTIONS[category as keyof typeof GRADING_OPTIONS] && (
                <div className="bg-accent/5 p-6 rounded-xl border-2 border-accent/20 space-y-4">
                  <h3 className="font-black uppercase tracking-widest text-sm">Grading Information (Optional)</h3>
                  
                  <div className="flex items-center gap-4">
                    <Label htmlFor="is-graded" className="flex items-center gap-2 cursor-pointer">
                      <input
                        id="is-graded"
                        type="checkbox"
                        aria-label="Item is professionally graded"
                        title="Item is professionally graded"
                        checked={isGraded}
                        onChange={(e) => {
                          setIsGraded(e.target.checked);
                          if (!e.target.checked) {
                            setGradingCompany('');
                            setGradingGrade('');
                          }
                        }}
                        className="w-4 h-4 rounded border-2 cursor-pointer"
                      />
                      <span className="font-bold uppercase text-[10px] tracking-widest">Item is professionally graded</span>
                    </Label>
                  </div>

                  {isGraded && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Grading Company</Label>
                        <Select value={gradingCompany} onValueChange={setGradingCompany}>
                          <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADING_OPTIONS[category as keyof typeof GRADING_OPTIONS]?.companies.map(company => (
                              <SelectItem key={company} value={company}>{company}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Grade</Label>
                        <Select value={gradingGrade} onValueChange={setGradingGrade}>
                          <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                            <SelectValue placeholder="Select Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADING_OPTIONS[category as keyof typeof GRADING_OPTIONS]?.grades.map(grade => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">Pricing Model</Label>
                  <RadioGroup defaultValue="bin" className="flex gap-2" onValueChange={setType}>
                    <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors"><RadioGroupItem value="bin" id="bin" /><Label htmlFor="bin" className="cursor-pointer font-bold">Buy It Now</Label></div>
                    <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors"><RadioGroupItem value="auction" id="auction" /><Label htmlFor="auction" className="cursor-pointer font-bold">Auction</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest">{type === 'bin' ? 'Price' : 'Starting Bid'}</Label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">$</span>
                    <Input id="price" type="number" placeholder="0.00" className="pl-10 h-14 rounded-xl border-2 font-bold" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                </div>

                {type === 'bin' && (
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-xs font-black uppercase tracking-widest">Quantity Available</Label>
                    <Input id="quantity" type="number" placeholder="1" className="h-14 rounded-xl border-2 font-bold" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
                    <p className="text-xs text-muted-foreground">How many items are you selling?</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest">Description</Label>
                <Textarea id="description" placeholder="Tell buyers about the history and condition..." className="min-h-[150px] rounded-xl border-2 font-medium" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-2">
                <TagSection tags={tags} setTags={setTags} newTag={newTag} setNewTag={setNewTag} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest">Description</Label>
                <Textarea id="description" placeholder="Tell buyers about the history and condition..." className="min-h-[150px] rounded-xl border-2 font-medium" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest">Visibility</Label>
                <RadioGroup value={visibility} className="grid grid-cols-2 gap-3" onValueChange={(val) => setVisibility(val as 'Visible' | 'Invisible')}>
                  <div className={cn("flex flex-col gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer", visibility === 'Visible' ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                    <RadioGroupItem value="Visible" id="vis-visible" className="sr-only" />
                    <Label htmlFor="vis-visible" className="cursor-pointer flex flex-col gap-1">
                      <span className="font-black uppercase tracking-widest text-xs">Visible</span>
                      <span className="text-[9px] text-muted-foreground font-medium">Show in browse & shop</span>
                    </Label>
                  </div>
                  <div className={cn("flex flex-col gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer", visibility === 'Invisible' ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                    <RadioGroupItem value="Invisible" id="vis-invisible" className="sr-only" />
                    <Label htmlFor="vis-invisible" className="cursor-pointer flex flex-col gap-1">
                      <span className="font-black uppercase tracking-widest text-xs">Invisible</span>
                      <span className="text-[9px] text-muted-foreground font-medium">Only you can see</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </section>

            <section className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed space-y-8">
              <ShippingSection
                shippingType={shippingType}
                setShippingType={setShippingType}
                weight={weight}
                setWeight={setWeight}
                length={length}
                setLength={setLength}
                width={width}
                setWidth={setWidth}
                height={height}
                setHeight={setHeight}
                isCalculatingShipping={isCalculatingShipping}
                calculateShipping={calculateShipping}
              />
            </section>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black h-20 text-2xl rounded-2xl shadow-xl transition-all active:scale-95 uppercase italic tracking-tighter">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "List Item Now"}
            </Button>
          </div>

          <aside className="space-y-6">
            <div className="bg-card/50 border-accent/20 border-2 p-8 rounded-2xl shadow-2xl sticky top-24">
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