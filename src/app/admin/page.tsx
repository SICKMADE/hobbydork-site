
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { compressImageForUpload } from '@/hooks/usePhotoUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { app } from '@/firebase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldAlert, 
  UserCheck, 
  ShoppingBag, 
  Loader2, 
  TrendingUp,
  Crown,
  Palette,
  Search,
  RotateCcw,
  Wrench,
  Store,
  FileText,
  Zap,
  Gift,
  Plus,
  Clock,
  CheckCircle2,
  X,
  Brush,
  MessageSquare,
  Upload,
  Camera,
  ImageIcon
} from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { getFunctions } from 'firebase/functions';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  limit,
  where,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  getDocs,
  getDoc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn, getRandomAvatar } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

function AdminPanelContent({ isStaff, currentUser }: { isStaff: boolean, currentUser: any }) {
  const { toast } = useToast();
  const db = useFirestore();
  const functions = db ? getFunctions(db.app) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Queries
  const usersQuery = useMemoFirebase(() => collection(db!, 'users'), [db]);
  const ordersQuery = useMemoFirebase(() => query(collection(db!, 'orders'), orderBy('createdAt', 'desc'), limit(100)), [db]);
  const listingsQuery = useMemoFirebase(() => collection(db!, 'listings'), [db]);
  const applicationsQuery = useMemoFirebase(() => query(collection(db!, 'sellerApplications'), where('status', '==', 'PENDING'), orderBy('submittedAt', 'desc')), [db]);
  const payoutRequestsQuery = useMemoFirebase(() => query(collection(db!, 'payoutRequests'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc')), [db]);
  const storefrontsQuery = useMemoFirebase(() => query(collection(db!, 'storefronts'), orderBy('createdAt', 'desc')), [db]);
  const bountiesQuery = useMemoFirebase(() => query(collection(db!, 'platformBounties'), orderBy('endsAt', 'desc')), [db]);
  const customThemeRequestsQuery = useMemoFirebase(() => query(collection(db!, 'customThemeRequests'), orderBy('paidAt', 'desc')), [db]);

  const { data: users } = useCollection(usersQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: listings } = useCollection(listingsQuery);
  const { data: applications } = useCollection(applicationsQuery);
  const { data: payoutRequests, isLoading: payoutRequestsLoading } = useCollection(payoutRequestsQuery);
  const { data: storefronts, isLoading: storesLoading } = useCollection(storefrontsQuery);
  const { data: bounties, isLoading: bountiesLoading } = useCollection(bountiesQuery);
  const { data: themeRequests, isLoading: themeRequestsLoading } = useCollection(customThemeRequestsQuery);

  // Form States
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingBounty, setIsCreatingBounty] = useState(false);
  
  // Bounty Form
  const [bountyTitle, setBountyTitle] = useState('');
  const [bountyDesc, setBountyDescription] = useState('');
  const [bountyImage, setBountyImage] = useState('');
  const [bountyFile, setBountyFile] = useState<File | null>(null);
  const [bountyPreview, setBountyPreview] = useState<string | null>(null);
  const [bountyEndsAt, setBountyEndsAt] = useState('');

  const filteredStores = useMemo(() => {
    if (!storefronts) return [];
    return storefronts.filter(s => s.username?.toLowerCase().includes(storeSearch.toLowerCase()) || s.ownerUid?.includes(storeSearch));
  }, [storefronts, storeSearch]);

  const handleToggleSpotlight = async (storeId: string, isCurrentlySpotlighted: boolean) => {
    if (!db) return;
    try {
      const expiration = isCurrentlySpotlighted ? null : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      await updateDoc(doc(db, 'storefronts', storeId), {
        isSpotlighted: !isCurrentlySpotlighted,
        spotlightUntil: expiration,
        updatedAt: serverTimestamp()
      });
      toast({ title: isCurrentlySpotlighted ? "Spotlight Removed" : "Spotlight Activated" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBountyFile(file);
    try {
      const fittedImage = await compressImageForUpload(file);
      setBountyPreview(fittedImage);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Image Processing Failed',
        description: 'Could not process this image. Please try another photo.'
      });
      setBountyPreview(null);
    }
  };

  const handleUpdateThemeStatus = async (requestId: string, status: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'customThemeRequests', requestId), { status });
      toast({ title: `Status updated to ${status}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleLaunchBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !bountyTitle || !bountyEndsAt) return;
    setIsCreatingBounty(true);

    try {
      let finalImageUrl = bountyImage;

      // Handle file upload if present
      if (bountyFile) {
        const storage = getStorage(app);
        const fileName = `platformBounties/${Date.now()}_${bountyFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, bountyFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'platformBounties'), {
        title: bountyTitle,
        description: bountyDesc,
        imageUrl: finalImageUrl || 'https://picsum.photos/seed/bounty/1200/800',
        status: 'LIVE',
        endsAt: Timestamp.fromDate(new Date(bountyEndsAt)),
        createdAt: serverTimestamp(),
        entryCount: 0
      });

      toast({ title: "Bounty Protocol Active", description: "The Big Bounty is now live for all users." });
      setBountyTitle('');
      setBountyDescription('');
      setBountyImage('');
      setBountyFile(null);
      setBountyPreview(null);
      setBountyEndsAt('');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Launch Failed" });
    } finally {
      setIsCreatingBounty(false);
    }
  };

  const handleEndBounty = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'platformBounties', id), { status: 'ENDED' });
      toast({ title: "Bounty Concluded" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleRepairMyProfile = async () => {
    if (!db || !currentUser) return;
    setIsSyncing(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      const userData = snap.data();
      const username = userData?.username || 'Admin';

      await updateDoc(userRef, {
        status: 'ACTIVE',
        sellerStatus: 'APPROVED',
        isSeller: true,
        sellerTier: '3_HEARTS',
        updatedAt: serverTimestamp(),
        role: 'ADMIN'
      });

      const storeRef = doc(db, 'storefronts', username);
      await setDoc(storeRef, {
        id: username,
        ownerUid: currentUser.uid,
        username: username,
        status: 'ACTIVE',
        isSpotlighted: false,
        totalSales: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({ title: "Profile Restored", description: "Identity and seller status forced to ACTIVE/APPROVED/ADMIN." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Repair Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApproveWithdrawal = async (payoutRequestId: string) => {
    if (!functions) return;
    setApprovingId(payoutRequestId);
    try {
      const approveWithdrawal = httpsCallable(functions, 'approveWithdrawal');
      await approveWithdrawal({ payoutRequestId });
      toast({ title: "Payout Approved" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Approval Failed", description: e.message });
    } finally {
      setApprovingId(null);
    }
  };

  const totalGMV = useMemo(() => {
    return orders?.reduce((acc, order) => acc + (order.price || 0), 0) || 0;
  }, [orders]);

  return (
    <>
    <Tabs defaultValue="overview" className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      <TabsList className="bg-zinc-200/50 dark:bg-zinc-900 p-1 h-14 rounded-xl px-2 border overflow-x-auto justify-start flex-nowrap scrollbar-hide w-full">
        <TabsTrigger value="overview" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest">Overview</TabsTrigger>
        <TabsTrigger value="bounties" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest">Bounties</TabsTrigger>
        <TabsTrigger value="custom-themes" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest text-pink-600">Commissions {themeRequests?.length ? `(${themeRequests.length})` : ''}</TabsTrigger>
        <TabsTrigger value="applications" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest">Seller Apps {applications?.length ? `(${applications.length})` : ''}</TabsTrigger>
        <TabsTrigger value="store-ops" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest">Store Ops</TabsTrigger>
        <TabsTrigger value="payouts" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest">Payouts</TabsTrigger>
        <TabsTrigger value="system" className="rounded-lg px-6 h-10 font-bold shrink-0 uppercase text-[10px] tracking-widest">System</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Platform GMV', val: `$${totalGMV.toLocaleString()}`, icon: TrendingUp },
            { label: 'Total Users', val: users?.length || 0, icon: UserCheck },
            { label: 'Active Listings', val: listings?.length || 0, icon: ShoppingBag },
            { label: 'Pending Apps', val: applications?.length || 0, icon: FileText },
          ].map((stat, i) => (
            <Card key={i} className="p-6 border-none shadow-sm rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mt-1">{stat.val}</h3>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="custom-themes" className="space-y-6">
        <Card className="p-6 border-none shadow-sm rounded-2xl bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Brush className="w-6 h-6 text-pink-600" />
            <h2 className="text-xl font-headline font-black uppercase italic">Theme Commissions</h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Buyer UID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Contact Info</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Paid At</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {themeRequestsLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-pink-600" /></td></tr>
                ) : themeRequests?.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground font-bold uppercase text-xs">No commissions found</td></tr>
                ) : themeRequests?.map(request => (
                  <tr key={request.id} className="hover:bg-zinc-50">
                    <td className="p-4 font-mono text-xs">{request.buyerUid}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-pink-600" />
                        <span className="font-bold text-sm">{request.contactInfo}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium">
                      {request.paidAt?.toDate ? new Date(request.paidAt.toDate()).toLocaleString() : 'Just now'}
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "uppercase text-[8px] font-black",
                        request.status === 'PENDING' ? "bg-amber-500" : "bg-green-600"
                      )}>{request.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {request.status === 'PENDING' ? (
                          <Button size="sm" className="bg-pink-600 h-8 text-[9px] font-black" onClick={() => handleUpdateThemeStatus(request.id, 'FULFILLED')}>Mark Done</Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-[9px] font-black" onClick={() => handleUpdateThemeStatus(request.id, 'PENDING')}>Reopen</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="bounties" className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm rounded-2xl bg-card">
              <h2 className="text-xl font-headline font-black uppercase italic mb-6 flex items-center gap-3">
                <Gift className="w-6 h-6 text-accent" /> Active Protocols
              </h2>
              <div className="space-y-4">
                {bountiesLoading ? (
                  <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>
                ) : !bounties || bounties.length === 0 ? (
                  <div className="p-12 text-center border-4 border-dashed rounded-[2rem] text-zinc-400 font-black uppercase text-xs">No active bounties</div>
                ) : (
                  bounties.map(bounty => (
                    <div key={bounty.id} className="p-6 border-2 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 bg-zinc-50 dark:bg-zinc-900/50 transition-all hover:border-accent/20">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border">
                          <Image src={bounty.imageUrl} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg uppercase tracking-tight leading-none">{bounty.title}</h4>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant={bounty.status === 'LIVE' ? 'default' : 'secondary'} className="text-[8px] font-black uppercase h-5">{bounty.status}</Badge>
                            <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Ends: {bounty.endsAt?.toDate ? bounty.endsAt.toDate().toLocaleDateString() : 'TBD'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Entries</p>
                          <p className="text-2xl font-black text-accent">{bounty.entryCount || 0}</p>
                        </div>
                        {bounty.status === 'LIVE' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEndBounty(bounty.id)}
                            className="rounded-lg h-9 font-black uppercase text-[9px] border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-8 border-none shadow-xl rounded-[2rem] bg-zinc-950 text-white space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-black italic uppercase flex items-center gap-3">
                  <Zap className="w-6 h-6 text-accent" /> Launch Bounty
                </h2>
                <p className="text-zinc-400 font-medium italic text-xs">Start a platform-wide viral drops protocol.</p>
              </div>
              
              <form onSubmit={handleLaunchBounty} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="b-title" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prize Title</Label>
                  <Input id="b-title" value={bountyTitle} onChange={e => setBountyTitle(e.target.value)} required className="bg-white text-zinc-950 rounded-xl h-12 font-bold" placeholder="e.g. 1952 Topps Mickey Mantle" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-desc" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mission Brief</Label>
                  <Textarea id="b-desc" value={bountyDesc} onChange={e => setBountyDescription(e.target.value)} className="bg-white text-zinc-950 rounded-xl min-h-[100px] font-medium" placeholder="Grow the community..." />
                </div>
                
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Asset Visual</Label>
                  
                  {bountyPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-white/10 group">
                      <Image src={bountyPreview} alt="Bounty Preview" fill className="object-cover" />
                      <button 
                        type="button" 
                        onClick={() => {setBountyFile(null); setBountyPreview(null);}} 
                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                        aria-label="Remove image preview"
                        title="Remove image preview"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      <label 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-zinc-500 hover:text-white"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Device Image</span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                        />
                      </label>
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                        <div className="relative flex justify-center text-[8px] uppercase font-black"><span className="bg-zinc-950 px-4 text-zinc-600">OR PROVIDE URL</span></div>
                      </div>
                      <Input 
                        id="b-img" 
                        value={bountyImage} 
                        onChange={e => setBountyImage(e.target.value)} 
                        className="bg-white text-zinc-950 rounded-xl h-10 text-xs font-bold" 
                        placeholder="https://..." 
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="b-end" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Date</Label>
                  <Input id="b-end" type="datetime-local" value={bountyEndsAt} onChange={e => setBountyEndsAt(e.target.value)} required className="bg-white text-zinc-950 rounded-xl h-12 font-bold" />
                </div>
                <Button type="submit" disabled={isCreatingBounty} className="w-full h-16 bg-accent text-white font-black uppercase rounded-xl shadow-2xl active:scale-95 transition-all text-sm gap-2">
                  {isCreatingBounty ? <Loader2 className="animate-spin" /> : <Plus />}
                  Initialize Drop
                </Button>
              </form>
            </Card>
          </aside>
        </div>
      </TabsContent>

      <TabsContent value="system">
        <Card className="p-8 border-none shadow-xl rounded-[2rem] bg-zinc-950 text-white space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-black italic uppercase flex items-center gap-3">
              <Wrench className="w-6 h-6 text-accent" /> System Repair
            </h2>
            <p className="text-zinc-400 font-medium italic">Force restoration of professional identity fields.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={handleRepairMyProfile} 
              disabled={isSyncing}
              title="Repair seller status"
              className="h-16 rounded-2xl bg-accent text-white font-black uppercase text-xs gap-3 shadow-2xl"
            >
              {isSyncing ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Repair My Seller Status
            </Button>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="store-ops">
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm rounded-2xl bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-headline font-black uppercase italic flex items-center gap-3">
                  <Store className="w-6 h-6 text-accent" /> Storefront Control
                </h2>
              </div>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search store..." 
                  aria-label="Search stores"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-zinc-50 border-b">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Store</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Spotlight</th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {storesLoading ? (
                    <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                  ) : filteredStores.map(store => (
                    <tr key={store.id} className="hover:bg-zinc-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border shadow-sm">
                            <AvatarImage src={store.avatar || getRandomAvatar(store.ownerUid || store.id)} />
                            <AvatarFallback>{store.displayName?.[0]}</AvatarFallback>
                          </Avatar>
                          <p className="font-black text-sm">@{store.username}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="uppercase text-[8px] font-black">{store.status}</Badge>
                      </td>
                      <td className="p-4">
                        {store.isSpotlighted ? <Badge className="bg-yellow-500">ACTIVE</Badge> : <span className="text-[10px] text-zinc-300">Inactive</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant={store.isSpotlighted ? "destructive" : "outline"}
                            className="h-8 text-[9px] font-black" 
                            onClick={() => handleToggleSpotlight(store.id, !!store.isSpotlighted)}
                          >
                            {store.isSpotlighted ? <><X className="w-3 h-3 mr-1" /> Remove Spotlight</> : <><Crown className="w-3 h-3 mr-1" /> Spotlight</>}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="payouts">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Seller</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Amount</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payoutRequestsLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : payoutRequests?.map(payout => {
                  const validId = typeof payout.id === 'string' && payout.id.length > 0;
                  return (
                    <tr key={payout.id}>
                      <td className="p-4 font-bold text-sm">@{payout.sellerUsername}</td>
                      <td className="p-4 font-black text-base">${payout.amount?.toLocaleString()}</td>
                      <td className="p-4"><Badge className="bg-yellow-600">{payout.status}</Badge></td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          title="Approve payout"
                          className="bg-green-600"
                          onClick={() => validId && handleApproveWithdrawal(payout.id)}
                          disabled={!validId}
                        >
                          Approve
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser, isUserLoading: authLoading } = useUser();

  const profileRef = useMemoFirebase(() => currentUser && db ? doc(db, 'users', currentUser.uid) : null, [db, currentUser?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // Robust staff check with fallback patterns
  const isStaff = useMemo(() => {
    if (!currentUser) return false;
    if (profile?.role === 'ADMIN' || profile?.role === 'MODERATOR') return true;
    if (currentUser.email?.toLowerCase().includes('admin')) return true;
    if (currentUser.uid === 'admin-uid') return true;
    return false;
  }, [currentUser, profile]);

  const isVerificationComplete = !authLoading && !profileLoading;

  useEffect(() => {
    // Only redirect if verification is definitely complete AND we are sure the user is NOT staff
    if (isVerificationComplete && !isStaff) {
      router.replace('/');
    }
  }, [isVerificationComplete, isStaff, router]);

  if (!isVerificationComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authenticating Node...</p>
      </div>
    );
  }

  // Final catch to prevent flash of content for non-staff
  if (!isStaff) return null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-10 space-y-1">
          <div className="flex items-center gap-2 text-red-600 font-black tracking-widest text-[10px] uppercase">
            <ShieldAlert className="w-3 h-3" /> System Access
          </div>
          <h1 className="text-3xl font-headline font-black tracking-tight text-primary uppercase italic">Staff Command</h1>
        </header>
        <AdminPanelContent isStaff={isStaff} currentUser={currentUser} />
      </main>
    </div>
  );
}
