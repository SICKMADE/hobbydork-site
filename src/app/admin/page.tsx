
'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldAlert, 
  Trash2, 
  UserCheck, 
  Zap, 
  MessageSquare, 
  ShoppingBag, 
  Gift, 
  Loader2,
  TrendingUp,
  CheckCircle2,
  Eye,
  Ban,
  Wallet,
  XCircle,
  MessageCircle,
  FileText,
  Star,
  Palette,
  Crown,
  Instagram,
  Twitter,
  Globe,
  Check,
  X,
  History,
  ShieldCheck,
  Search,
  Layout,
  Plus,
  Store,
  RotateCcw,
  Wrench
} from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { getFunctions } from 'firebase/functions';
import { 
  collection, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  limit,
  where,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn, getRandomAvatar } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function AdminPanelContent({ isStaff, currentUser }: { isStaff: boolean, currentUser: any }) {
  const { toast } = useToast();
  const db = useFirestore();
  const functions = db ? getFunctions(db.app) : undefined;

  const reportsQuery = useMemoFirebase(() => query(collection(db!, 'reports'), orderBy('timestamp', 'desc')), [db]);
  const usersQuery = useMemoFirebase(() => collection(db!, 'users'), [db]);
  const ordersQuery = useMemoFirebase(() => query(collection(db!, 'orders'), orderBy('createdAt', 'desc'), limit(100)), [db]);
  const listingsQuery = useMemoFirebase(() => collection(db!, 'listings'), [db]);
  const applicationsQuery = useMemoFirebase(() => query(collection(db!, 'sellerApplications'), where('status', '==', 'PENDING'), orderBy('submittedAt', 'desc')), [db]);
  const payoutRequestsQuery = useMemoFirebase(() => query(collection(db!, 'payoutRequests'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc')), [db]);
  const storefrontsQuery = useMemoFirebase(() => query(collection(db!, 'storefronts'), orderBy('createdAt', 'desc')), [db]);

  const { data: reports, isLoading: reportsLoading } = useCollection(reportsQuery);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);
  const { data: applications, isLoading: appsLoading } = useCollection(applicationsQuery);
  const { data: payoutRequests, isLoading: payoutRequestsLoading } = useCollection(payoutRequestsQuery);
  const { data: storefronts, isLoading: storesLoading } = useCollection(storefrontsQuery);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredStores = useMemo(() => {
    if (!storefronts) return [];
    return storefronts.filter(s => s.username?.toLowerCase().includes(storeSearch.toLowerCase()) || s.ownerUid?.includes(storeSearch));
  }, [storefronts, storeSearch]);

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
        sellerTier: 'GOLD',
        updatedAt: serverTimestamp()
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

      toast({ title: "Profile Restored", description: "Identity and seller status forced to ACTIVE/APPROVED." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Repair Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApproveApplication = async (app: any) => {
    if (!functions) return;
    setApprovingId(app.id);
    try {
      await updateDoc(doc(db!, 'sellerApplications', app.id), {
        status: 'APPROVED',
        updatedAt: serverTimestamp()
      });
      const finalizeSeller = httpsCallable(functions, 'finalizeSeller');
      await finalizeSeller({ targetUid: app.uid });
      toast({ title: "Dealer Approved", description: `@${app.username} is now a verified seller.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Approval Failed", description: e.message });
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectApplication = async (appId: string, uid: string) => {
    if (!db) return;
    setDenyingId(appId);
    try {
      await updateDoc(doc(db, 'sellerApplications', appId), {
        status: 'REJECTED',
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', uid), {
        sellerStatus: 'REJECTED',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Application Rejected" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Rejection Failed" });
    } finally {
      setDenyingId(null);
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

  const handleManualSpotlight = async (storeId: string) => {
    if (!db) return;
    try {
      const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'storefronts', storeId), {
        isSpotlighted: true,
        spotlightUntil: Timestamp.fromDate(expiration),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Store Spotlighted" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleSyncStoreData = async () => {
    if (!db) return;
    setIsSyncing(true);
    try {
      const storesSnap = await getDocs(collection(db, 'storefronts'));
      let count = 0;
      for (const storeDoc of storesSnap.docs) {
        const data = storeDoc.data();
        if (data.isSpotlighted === undefined || data.totalSales === undefined) {
          await updateDoc(storeDoc.ref, {
            isSpotlighted: data.isSpotlighted || false,
            totalSales: data.totalSales || 0,
            updatedAt: serverTimestamp()
          });
          count++;
        }
      }
      toast({ title: "Sync Complete", description: `Updated ${count} storefronts.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Sync Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGrantTheme = async (uid: string, themeId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        ownedPremiumProducts: arrayUnion(themeId),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Theme Granted" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleResolveReport = async (reportId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'RESOLVED', updatedAt: serverTimestamp() });
      toast({ title: 'Report resolved' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
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
              className="h-16 rounded-2xl bg-accent text-white font-black uppercase text-xs gap-3 shadow-2xl"
            >
              {isSyncing ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Repair My Seller Status
            </Button>
            <Button 
              onClick={handleSyncStoreData} 
              disabled={isSyncing}
              variant="outline"
              className="h-16 rounded-2xl border-white/10 bg-white/5 font-black uppercase text-xs gap-3"
            >
              {isSyncing ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Sync Store Discovery Data
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
                            <AvatarImage src={store.avatar || getRandomAvatar(store.id)} />
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
                          <Button size="sm" variant="outline" className="h-8 text-[9px] font-black" onClick={() => handleManualSpotlight(store.id)}>
                            <Crown className="w-3 h-3 mr-1" /> Spotlight
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 text-[9px] font-black">
                                <Palette className="w-3 h-3 mr-1" /> Grant Theme
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Grant Premium Theme</DialogTitle></DialogHeader>
                              <div className="grid grid-cols-1 gap-2 py-4">
                                {['p2', 'p3', 'p4', 'p5'].map(tid => (
                                  <Button key={tid} variant="outline" onClick={() => handleGrantTheme(store.ownerUid, tid)}>Grant {tid}</Button>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
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
                ) : payoutRequests?.map(payout => (
                  <tr key={payout.id}>
                    <td className="p-4 font-bold text-sm">@{payout.sellerUsername}</td>
                    <td className="p-4 font-black text-base">${payout.amount?.toLocaleString()}</td>
                    <td className="p-4"><Badge className="bg-yellow-600">{payout.status}</Badge></td>
                    <td className="p-4 text-right">
                      <Button size="sm" className="bg-green-600" onClick={() => handleApproveWithdrawal(payout.id)}>Approve</Button>
                    </td>
                  </tr>
                ))}
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

  const isVerificationComplete = !authLoading && !profileLoading;
  const isStaff = !!(profile && (profile.role === 'ADMIN' || profile.role === 'MODERATOR'));

  useEffect(() => {
    if (isVerificationComplete && (!currentUser || !isStaff)) router.push('/');
  }, [currentUser, isVerificationComplete, isStaff, router]);

  if (!isVerificationComplete) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!currentUser || !isStaff) return null;

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
