'use client';

import { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { getRandomAvatar } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
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
    if (!db || !user) return;
    setIsDeletingAccount(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-headline font-black uppercase italic">Account Settings</h1>
          <p className="text-sm text-muted-foreground font-medium">@{profile?.username || user?.email?.split('@')[0]}</p>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted p-1 h-14 rounded-xl px-2 mb-8 flex-nowrap overflow-x-auto justify-start md:justify-start">
            <TabsTrigger value="profile" className="rounded-lg px-8 h-10 font-bold shrink-0">Identity</TabsTrigger>
            <TabsTrigger value="address" className="rounded-lg px-8 h-10 font-bold shrink-0">Address</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg px-8 h-10 font-bold shrink-0">Notifications</TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg px-8 h-10 font-bold shrink-0">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="rounded-xl border">
              <CardContent className="p-5 sm:p-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                  <div className="space-y-3 w-full md:w-auto flex flex-col items-center md:items-start">
                    <Label htmlFor="account-photo-upload" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Icon</Label>
                    <div className="relative w-32 h-32 rounded-2xl bg-muted overflow-hidden border-2 border-border shadow-sm group">
                      <Image src={effectiveAvatar} alt="Avatar" fill className="object-cover" />
                      <label htmlFor="account-photo-upload" className="absolute inset-0 bg-white border-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl">
                        <Camera className="w-8 h-8 text-zinc-950" />
                      </label>
                    </div>
                    <label htmlFor="account-photo-upload" className="sr-only">Upload account photo</label>
                    <input id="account-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Button variant="outline" size="sm" className="w-full h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider" onClick={() => document.getElementById('account-photo-upload')?.click()}>
                      <Camera className="w-3 h-3 mr-1.5 text-zinc-950" /> Change Photo
                    </Button>
                    {photoURL && (
                      <Button variant="ghost" size="sm" onClick={() => setPhotoURL('')} className="w-full text-xs font-bold text-red-600 uppercase h-8 hover:bg-red-50">
                        <X className="w-3 h-3 mr-1" /> Reset
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full space-y-6 pt-6 md:pt-10">
                    <p className="text-sm text-muted-foreground font-medium italic">Manage your public identity icon. This is used for your collector profile and shop storefront.</p>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-primary text-primary-foreground dark:text-zinc-950 font-black h-10 px-6 rounded-lg gap-2 shadow-sm">
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSavingProfile ? 'Saving...' : 'Save Profile Image'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-6">
            <Card className="rounded-xl border">
              <CardContent className="p-5 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addr-street-input" className="text-[10px] font-black uppercase tracking-widest">Street Address</Label>
                    <Input id="addr-street-input" placeholder="123 Main St" className="h-10 rounded-lg border" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-city-input" className="text-[10px] font-black uppercase tracking-widest">City</Label>
                    <Input id="addr-city-input" placeholder="City" className="h-10 rounded-lg border" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-state-input" className="text-[10px] font-black uppercase tracking-widest">State / Province</Label>
                    <Input id="addr-state-input" placeholder="CA" className="h-10 rounded-lg border uppercase" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addr-zip-input" className="text-[10px] font-black uppercase tracking-widest">ZIP / Postal Code</Label>
                    <Input id="addr-zip-input" placeholder="12345" className="h-10 rounded-lg border" value={address.zip} onChange={(e) => setAddress({...address, zip: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleSaveAddress} disabled={isSavingAddress} className="bg-primary text-primary-foreground dark:text-zinc-950 font-black h-10 px-6 rounded-lg gap-2 shadow-sm">
                  {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="rounded-xl border">
              <CardContent className="p-5 sm:p-8 space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label htmlFor="switch-notif-orders" className="font-bold text-sm">Order Updates</Label>
                      <p className="text-xs text-muted-foreground">Get notified about order status changes</p>
                    </div>
                    <Switch 
                      id="switch-notif-orders"
                      checked={notifications.orderUpdates} 
                      onCheckedChange={(checked) => setNotifications({...notifications, orderUpdates: checked})} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label htmlFor="switch-notif-messages" className="font-bold text-sm">Messages</Label>
                      <p className="text-xs text-muted-foreground">Notifications for new messages</p>
                    </div>
                    <Switch 
                      id="switch-notif-messages"
                      checked={notifications.messages} 
                      onCheckedChange={(checked) => setNotifications({...notifications, messages: checked})} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label htmlFor="switch-notif-tiers" className="font-bold text-sm">Tier Changes</Label>
                      <p className="text-xs text-muted-foreground">Get notified when your seller tier changes</p>
                    </div>
                    <Switch 
                      id="switch-notif-tiers"
                      checked={notifications.tierChanges} 
                      onCheckedChange={(checked) => setNotifications({...notifications, tierChanges: checked})} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="switch-notif-emails" className="font-bold text-sm">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch 
                      id="switch-notif-emails"
                      checked={notifications.emailNotifications} 
                      onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})} 
                    />
                  </div>
                </div>
                <Button onClick={handleSaveNotifications} disabled={isSavingNotifications} className="bg-primary text-primary-foreground dark:text-zinc-950 font-black h-10 px-6 rounded-lg gap-2 shadow-sm">
                  {isSavingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="rounded-xl border">
              <CardContent className="p-5 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-black uppercase text-sm tracking-wider mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                  <Button onClick={() => setIsDeleteDialogOpen(true)} variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase">Delete Account?</DialogTitle>
                  <DialogDescription className="text-xs">This action cannot be reversed</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">All your data will be permanently deleted.</p>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                  {isDeletingAccount ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
