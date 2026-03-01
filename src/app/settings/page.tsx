'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  User as UserIcon, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  Save, 
  Lock, 
  AlertTriangle,
  Edit3,
  Camera,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getRandomAvatar, filterProfanity } from '@/lib/utils';
import Image from 'next/image';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  });

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.shippingAddress) setAddress(profile.shippingAddress);
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoURL(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!db || !user) return;
    setIsSavingProfile(true);

    // Apply global profanity filter
    const sanitizedName = filterProfanity(displayName);
    const sanitizedBio = filterProfanity(bio);

    const data = { 
      displayName: sanitizedName, 
      bio: sanitizedBio, 
      photoURL, 
      updatedAt: serverTimestamp() 
    };
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Profile Updated' });
        setIsSavingProfile(false);
      })
      .catch(async (error) => {
        setIsSavingProfile(false);
      });
  };

  const handleSaveAddress = async () => {
    if (!db || !user) return;
    setIsSavingAddress(true);
    const data = { shippingAddress: address, updatedAt: serverTimestamp() };
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Shipping Profile Updated' });
        setIsSavingAddress(false);
      })
      .catch(async (error) => {
        setIsSavingAddress(false);
      });
  };

  if (!mounted || authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const effectiveAvatar = photoURL || profile?.photoURL || getRandomAvatar(user?.uid || 'default');

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-10 space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-headline font-black uppercase italic">Collector Console</h1>
          <p className="text-muted-foreground font-medium">Manage your identity and logistics profile.</p>
        </header>

        <div className="grid gap-12">
          <section className="space-y-6">
            <h2 className="text-xl font-headline font-black flex items-center gap-2 uppercase tracking-tight">
              <Edit3 className="w-5 h-5 text-accent" /> Profile Customization
            </h2>
            <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Photo</Label>
                    <div className="relative w-32 h-32 rounded-[2.5rem] bg-zinc-100 overflow-hidden border-4 border-zinc-50 shadow-xl group">
                      <Image src={effectiveAvatar} alt="Avatar" fill className="object-cover" />
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                        <input type="file" accept="image/*" aria-label="Upload profile photo" title="Upload profile photo" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                    {photoURL && (
                      <Button variant="ghost" size="sm" onClick={() => setPhotoURL('')} className="text-xs font-bold text-red-500 uppercase h-8 p-0 hover:bg-transparent">
                        <X className="w-3 h-3 mr-1" /> Reset to Default
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</Label>
                      <Input placeholder="Public name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About Me</Label>
                      <Textarea placeholder="Collector bio..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[120px] rounded-xl border-2 font-medium" />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-accent text-white font-black h-12 px-8 rounded-xl gap-2 shadow-lg hover:bg-accent/90 active:scale-95 transition-all">
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-6">
            <h2 className="text-xl font-headline font-black flex items-center gap-2 uppercase tracking-tight">
              <MapPin className="w-5 h-5 text-accent" /> Logistics Profile
            </h2>
            <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Street Address</Label>
                    <Input placeholder="123 Collector St" className="h-12 rounded-xl border-2 font-bold" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">City</Label>
                    <Input placeholder="Hobby City" className="h-12 rounded-xl border-2 font-bold" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">State / Zip</Label>
                    <div className="flex gap-2">
                      <Input placeholder="CA" className="w-20 h-12 rounded-xl border-2 font-bold uppercase" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
                      <Input placeholder="Zip" className="flex-1 h-12 rounded-xl border-2 font-bold" value={address.zip} onChange={(e) => setAddress({...address, zip: e.target.value})} />
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveAddress} disabled={isSavingAddress} className="bg-primary text-white font-black h-12 px-8 rounded-xl gap-2 hover:bg-primary/90 active:scale-95 transition-all">
                  {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Address
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
