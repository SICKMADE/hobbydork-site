'use client';

import { useState, useEffect } from 'react';
import { compressImageForUpload } from '@/hooks/usePhotoUpload';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Save, 
  Loader2, 
  Camera,
  X,
  Trash2,
  AlertTriangle,
  Settings,
  ArrowLeft,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { getRandomAvatar } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
  const auth = useAuth()
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [photoURL, setPhotoURL] = useState('');

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    messages: true,
    tierChanges: true,
    promotions: false,
    emailNotifications: true
  });

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
      const isCustomPhoto = profile.photoURL && profile.photoURL.startsWith('data:');
      setPhotoURL(isCustomPhoto ? profile.photoURL : '');
      if (profile.notifications) setNotifications(profile.notifications);
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fittedImage = await compressImageForUpload(file);
        setPhotoURL(fittedImage);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Image Processing Failed',
          description: 'Could not process this image. Please try another photo.'
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!db || !user) return;
    setIsSavingProfile(true);

    const data: any = { 
      updatedAt: serverTimestamp() 
    };
    
    if (photoURL && photoURL.startsWith('data:')) {
      data.photoURL = photoURL;
    } else if (!photoURL) {
      data.photoURL = null;
    }
    
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Identity Updated' });
        setIsSavingProfile(false);
      })
      .catch(() => {
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
        toast({ title: 'Shipping Address Updated' });
        setIsSavingAddress(false);
      })
      .catch(() => {
        setIsSavingAddress(false);
      });
  };

  const handleSaveNotifications = async () => {
    if (!db || !user) return;
    setIsSavingNotifications(true);
    const data = { notifications, updatedAt: serverTimestamp() };
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Notification Preferences Updated' });
        setIsSavingNotifications(false);
      })
      .catch(() => {
        setIsSavingNotifications(false);
      });
  };

  const handleDeleteAccount = async () => {
    if (!db || !user || !auth) return;
    setIsDeletingAccount(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(auth.currentUser!);
      toast({ title: 'Account deleted' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Account Deletion Failed', description: getFriendlyErrorMessage(error) });
      setIsDeletingAccount(false);
    }
  };

  if (!mounted || authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const effectiveAvatar = photoURL || getRandomAvatar(user?.uid);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <header className="py-0 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-zinc-950 rounded-b-2xl p-4 md:p-6 shadow-2xl text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 hardware-grid-overlay opacity-[0.05]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-black tracking-widest text-[10px] uppercase">
                <User className="w-4 h-4 text-accent" /> Profile Management
              </div>
              <h1 className="text-xl md:text-3xl font-headline font-black tracking-tighter uppercase italic leading-none">
                User Settings
              </h1>
              <p className="text-muted-foreground font-medium text-xs">Manage your public profile & security.</p>
            </div>
            
            <div className="relative z-10 hidden md:flex items-center gap-4">
              <Button asChild variant="outline" className="h-9 px-5 rounded-full border-white/10 bg-white/5 text-white font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all">
                <Link href="/dashboard">
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <div className="mb-8 px-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Signed in as: <span className="text-primary">@{profile?.username || user?.email?.split('@')[0]}</span></p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted p-1 h-14 rounded-xl px-2 mb-8 flex-nowrap overflow-x-auto justify-start md:justify-start border">
            <TabsTrigger value="profile" className="rounded-lg px-8 h-10 font-black uppercase text-[10px] tracking-widest shrink-0">Identity</TabsTrigger>
            <TabsTrigger value="address" className="rounded-lg px-8 h-10 font-black uppercase text-[10px] tracking-widest shrink-0">Address</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg px-8 h-10 font-black uppercase text-[10px] tracking-widest shrink-0">Notifications</TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg px-8 h-10 font-black uppercase text-[10px] tracking-widest shrink-0">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="rounded-[1.5rem] border-none shadow-lg overflow-hidden">
              <CardContent className="p-5 sm:p-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                  <div className="space-y-3 w-full md:w-auto flex flex-col items-center md:items-start">
                    <Label htmlFor="account-photo-upload" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Icon</Label>
                    <div className="relative w-32 h-32 rounded-2xl bg-muted overflow-hidden border-2 border-border shadow-sm group">
                      <Image src={effectiveAvatar} alt="Avatar" fill className="object-cover" />
                      <label htmlFor="account-photo-upload" className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl">
                        <Camera className="w-8 h-8 text-white" />
                      </label>
                    </div>
                    <input id="account-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Button variant="outline" size="sm" className="w-full h-9 rounded-lg font-black text-[9px] uppercase tracking-widest border-2" onClick={() => document.getElementById('account-photo-upload')?.click()}>
                      <Camera className="w-3 h-3 mr-1.5" /> Change Photo
                    </Button>
                    {photoURL && (
                      <Button variant="ghost" size="sm" onClick={() => setPhotoURL('')} className="w-full text-[9px] font-black text-red-600 uppercase h-8 hover:bg-red-50">
                        <X className="w-3 h-3 mr-1" /> Reset
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full space-y-6 pt-6 md:pt-10">
                    <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">Manage your public identity icon. This is used for your collector profile, messaging, and storefront.</p>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-primary text-primary-foreground font-black h-12 px-8 rounded-xl gap-2 shadow-xl hover:bg-primary/90 transition-all active:scale-95">
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-6">
            <Card className="rounded-[1.5rem] border-none shadow-lg overflow-hidden">
              <CardContent className="p-5 sm:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addr-street-input" className="text-[10px] font-black uppercase tracking-widest ml-1">Street Address</Label>
                    <Input id="addr-street-input" placeholder="123 Main St" className="h-12 rounded-xl border-2 font-bold shadow-inner" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-city-input" className="text-[10px] font-black uppercase tracking-widest ml-1">City</Label>
                    <Input id="addr-city-input" placeholder="City" className="h-12 rounded-xl border-2 font-bold shadow-inner" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-state-input" className="text-[10px] font-black uppercase tracking-widest ml-1">State / Province</Label>
                    <Input id="addr-state-input" placeholder="CA" className="h-12 rounded-xl border-2 font-bold shadow-inner uppercase" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addr-zip-input" className="text-[10px] font-black uppercase tracking-widest ml-1">ZIP / Postal Code</Label>
                    <Input id="addr-zip-input" placeholder="12345" className="h-12 rounded-xl border-2 font-bold shadow-inner" value={address.zip} onChange={(e) => setAddress({...address, zip: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleSaveAddress} disabled={isSavingAddress} className="w-full sm:w-auto bg-primary text-primary-foreground font-black h-12 px-10 rounded-xl gap-2 shadow-xl transition-all active:scale-95">
                  {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Address
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="rounded-[1.5rem] border-none shadow-lg overflow-hidden">
              <CardContent className="p-5 sm:p-8 space-y-2">
                <div className="divide-y">
                  {[
                    { id: 'orders', label: 'Order Updates', sub: 'Status changes and delivery alerts', key: 'orderUpdates' },
                    { id: 'msgs', label: 'Messages', sub: 'New private chats and replies', key: 'messages' },
                    { id: 'tiers', label: 'Tier Changes', sub: 'Health status and heart updates', key: 'tierChanges' },
                    { id: 'emails', label: 'Email Notifications', sub: 'System alerts sent to your inbox', key: 'emailNotifications' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-6">
                      <div className="space-y-1">
                        <Label htmlFor={`switch-${item.id}`} className="font-black uppercase text-sm tracking-tight">{item.label}</Label>
                        <p className="text-xs text-muted-foreground font-medium italic">{item.sub}</p>
                      </div>
                      <Switch 
                        id={`switch-${item.id}`}
                        checked={(notifications as any)[item.key]} 
                        onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})} 
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-6">
                  <Button onClick={handleSaveNotifications} disabled={isSavingNotifications} className="w-full sm:w-auto bg-primary text-primary-foreground font-black h-12 px-10 rounded-xl gap-2 shadow-xl transition-all active:scale-95">
                    {isSavingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="rounded-[1.5rem] border-2 border-dashed border-red-100 bg-red-50/30 overflow-hidden">
              <CardContent className="p-5 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-black uppercase text-lg text-red-600 tracking-tighter flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Delete Account
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                    Permanently delete your collector node and all associated data. This action is irreversible and will purge your storefront, history, and active trades.
                  </p>
                </div>
                <Button onClick={() => setIsDeleteDialogOpen(true)} variant="outline" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                  Initiate Deletion
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
            <div className="bg-red-600 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-headline font-black uppercase italic tracking-tight">Danger Zone</DialogTitle>
                  <DialogDescription className="text-white/60 font-bold uppercase text-[8px] tracking-widest">Protocol: ACCOUNT_PURGE</DialogDescription>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-8 bg-card">
              <p className="text-sm font-medium italic text-muted-foreground">This will permanently terminate your connection to the HobbyDork network. All assets and reputation data will be destroyed.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-14 rounded-xl font-black uppercase text-[10px] border-2" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] rounded-xl shadow-xl transition-all" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                  {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Purge'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
