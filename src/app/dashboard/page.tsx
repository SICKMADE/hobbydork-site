'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  TrendingUp, 
  Medal, 
  Settings, 
  ChevronRight, 
  Loader2, 
  Zap, 
  Wallet, 
  Copy,
  Clock,
  CheckCircle2,
  Terminal,
  Activity,
  BarChart3,
  CreditCard,
  Lock,
  Cpu,
  Ticket,
  Palette,
  Heart,
  Eye,
  PlusCircle,
  Gift
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  limit,
  where,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ListingCard from '@/components/ListingCard';
import { TierBadge } from '@/components/TierBadge';

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const functions = db ? getFunctions(db.app) : undefined;

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // Queries
  const ordersQuery = useMemoFirebase(() => user && db ? query(collection(db, 'orders'), where('buyerUid', '==', user.uid), orderBy('createdAt', 'desc')) : null, [db, user?.uid]);
  const salesQuery = useMemoFirebase(() => user && db ? query(collection(db, 'orders'), where('sellerUid', '==', user.uid), orderBy('createdAt', 'desc')) : null, [db, user?.uid]);
  const bountyEntriesQuery = useMemoFirebase(() => user && db ? query(collection(db, 'platformBountyEntries'), where('uid', '==', user.uid)) : null, [db, user?.uid]);
  const watchlistQuery = useMemoFirebase(() => user && db ? query(collection(db, 'users', user.uid, 'watchlist'), orderBy('timestamp', 'desc')) : null, [db, user?.uid]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);
  const { data: bountyEntries } = useCollection(bountyEntriesQuery);
  const { data: watchlist, isLoading: watchlistLoading } = useCollection(watchlistQuery);

  const [isCalculatingTier, setIsCalculatingTier] = useState(false);
  const [isPayoutHistoryOpen, setIsPayoutHistoryOpen] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);

  const isSeller = !!profile?.isSeller;
  const username = profile?.username || 'Collector';

  // Derived Stats
  const lifetimeEarnings = useMemo(() => {
    return sales?.filter(s => s.status === 'Delivered').reduce((acc, s) => acc + (s.price || 0), 0) || 0;
  }, [sales]);

  const pendingPayout = useMemo(() => {
    return sales?.filter(s => s.status === 'Confirmed' || s.status === 'Shipped').reduce((acc, s) => acc + (s.price || 0), 0) || 0;
  }, [sales]);

  // Chart Data Simulation (Mocking last 7 days of sales)
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const dailySales = sales?.filter(s => {
        const sDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        return sDate.toDateString() === d.toDateString();
      });
      data.push({
        date: dateStr,
        revenue: dailySales?.reduce((acc, s) => acc + (s.price || 0), 0) || 0
      });
    }
    return data;
  }, [sales]);

  const handleCalculateTier = async () => {
    if (!functions) return;
    setIsCalculatingTier(true);
    try {
      const calculateTier = httpsCallable(functions, 'calculateSellerTier');
      await calculateTier({});
      toast({ title: "Tier Updated", description: "Seller performance metrics synchronized." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    } finally {
      setIsCalculatingTier(false);
    }
  };

  const handleOpenPayoutHistory = async () => {
    if (!functions || !profile?.stripeAccountId) {
      toast({ title: "Identity Required", description: "Complete Stripe onboarding to view payouts." });
      return;
    }
    setIsPayoutHistoryOpen(true);
    setIsLoadingPayouts(true);
    try {
      const getPayouts = httpsCallable(functions, 'getStripePayouts');
      const result: any = await getPayouts({ accountId: profile.stripeAccountId });
      setPayoutHistory(result.data.payouts || []);
    } catch (e) {
      toast({ variant: 'destructive', title: "Query Failed" });
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      <main className="container mx-auto px-2 sm:px-4 py-4 md:py-10 max-w-7xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section with Grid Background */}
        <header className="mb-6 md:mb-8 rounded-b-2xl overflow-hidden shadow-xl border-b-2 border-border/50 dashboard-header-bg">
          <div className="p-4 sm:p-8 md:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-accent font-black tracking-widest text-[8px] uppercase bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
                  <Terminal className="w-2.5 h-2.5" /> USER_ID: {user.uid.substring(0, 8).toUpperCase()}
                </div>
                <Badge variant="outline" className="rounded-full border-accent text-accent font-black uppercase text-[7px] tracking-widest px-2 h-5">
                  ROLE: {isSeller ? 'SELLER' : 'COLLECTOR'}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl md:text-4xl font-headline font-black uppercase tracking-tighter italic leading-none">Collector Dashboard</h1>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Signed in as: <span className="text-primary">@{username}</span></p>
              </div>
            </div>
            {isSeller && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="h-9 px-4 rounded-lg font-black uppercase text-[8px] tracking-widest border-2 flex-1 sm:flex-initial">
                    <Link href={`/storefronts/${username}`}>View My Storefront</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-9 px-4 rounded-lg font-black uppercase text-[8px] tracking-widest gap-1.5 flex-1 sm:flex-initial border-2">
                    <Link href="/listings/create"><PlusCircle className="w-3 h-3" />New Listing</Link>
                  </Button>
                  <Button asChild className="h-9 px-4 rounded-lg font-black uppercase text-[8px] tracking-widest gap-1.5 flex-1 sm:flex-initial bg-accent text-white shadow-lg">
                    <Link href="/giveaways/create"><Gift className="w-3 h-3" />Create Giveaway</Link>
                  </Button>
                  <Button asChild className="h-9 px-4 rounded-lg font-black uppercase text-[8px] tracking-widest gap-1.5 flex-1 sm:flex-initial bg-primary text-primary-foreground">
                    <Link href="/seller/settings"><Palette className="w-3.5 h-3.5" />Settings</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Action Grid */}
        {/* Action Grid - Active Bounties and AI Price Check shortcuts removed as requested */}

        {/* Tab Modules */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-muted p-1 h-12 rounded-xl px-1.5 mb-8 flex-nowrap overflow-x-auto scrollbar-hide flex border border-border/50 md:overflow-x-visible md:justify-center">
            <TabsTrigger value="orders" className="rounded-lg px-6 h-full font-black uppercase text-[9px] tracking-widest">My Orders</TabsTrigger>
            <TabsTrigger value="watchlist" className="rounded-lg px-6 h-full font-black uppercase text-[9px] tracking-widest">Watchlist</TabsTrigger>
            {isSeller && <TabsTrigger value="stats" className="rounded-lg px-6 h-full font-black uppercase text-[9px] tracking-widest">Seller Stats</TabsTrigger>}
            {isSeller && <TabsTrigger value="sales" className="rounded-lg px-6 h-full font-black uppercase text-[9px] tracking-widest">My Sales</TabsTrigger>}
            {isSeller && <TabsTrigger value="payouts" className="rounded-lg px-6 h-full font-black uppercase text-[9px] tracking-widest">Earnings</TabsTrigger>}
          </TabsList>

          <TabsContent value="orders" className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'ITEMS PURCHASED', val: orders?.length || 0, icon: Package },
                { label: 'PENDING DELIVERY', val: orders?.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length || 0, icon: Truck },
                { label: 'WATCHING', val: watchlist?.length || 0, icon: Eye }
              ].map((box, i) => (
                <Card key={i} className="p-6 rounded-2xl border bg-card shadow-sm hover:border-accent/20 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{box.label}</p>
                    <box.icon className="w-4 h-4 opacity-30" />
                  </div>
                  <h3 className="text-3xl font-headline font-black italic tracking-tighter">{box.val}</h3>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-accent" />
                <h2 className="text-xl font-headline font-black uppercase tracking-tight italic">Order History</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {ordersLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" /></div>
                ) : orders && orders.length > 0 ? orders.map(order => (
                  <Card key={order.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 rounded-xl border hover:border-accent transition-all bg-card shadow-sm">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border">
                      {order.imageUrl ? (
                        <Image src={order.imageUrl} alt={order.listingTitle} fill className="object-cover" />
                      ) : (
                        <Package className="w-5 h-5 m-auto opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <Badge variant="outline" className="mb-1 text-[7px] font-black uppercase border-accent text-accent tracking-widest h-4 px-2">
                        {order.status || 'Confirmed'}
                      </Badge>
                      <h4 className="font-black text-sm truncate uppercase tracking-tight italic leading-tight">{order.listingTitle}</h4>
                      <p className="text-[8px] font-bold text-zinc-400 mt-0.5 uppercase">ID: #{order.id.substring(0, 12).toUpperCase()}</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-lg font-black h-9 px-6 text-[8px] uppercase shrink-0 border-2 hover:bg-primary hover:text-white transition-all w-full sm:w-auto">
                      <Link href={`/orders/${order.id}`}>Track Item</Link>
                    </Button>
                  </Card>
                )) : (
                  <Card className="p-16 text-center border-2 border-dashed rounded-[2rem] bg-zinc-50/50 dark:bg-white/5">
                    <Package className="w-10 h-10 mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">No orders found.</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-4 h-4 text-accent fill-current" />
              <h2 className="text-xl font-headline font-black uppercase tracking-tight italic">My Watchlist</h2>
            </div>
            
            {watchlistLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
            ) : !watchlist || watchlist.length === 0 ? (
              <Card className="p-20 text-center border-2 border-dashed rounded-[2rem] bg-zinc-50/50 dark:bg-white/5">
                <Heart className="w-10 h-10 mx-auto mb-4 opacity-10" />
                <p className="text-xs font-black text-zinc-300 uppercase tracking-widest mb-4">You aren't watching any items yet.</p>
                <Button asChild variant="outline" className="rounded-xl border-2 font-black uppercase text-[10px]">
                  <Link href="/listings">Browse Listings</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {watchlist.map(item => (
                  <ListingCard 
                    key={item.id} 
                    listing={{
                      id: item.listingId || item.id,
                      title: item.title,
                      price: item.price,
                      imageUrl: item.imageUrl || null,
                      seller: 'Dealer',
                      category: 'Collectible',
                      status: 'Active',
                      type: 'Buy It Now',
                      tags: [],
                      createdAt: item.timestamp,
                      listingSellerId: ''
                    } as any} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {isSeller && (
            <TabsContent value="stats" className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                    <h2 className="text-xl font-headline font-black uppercase tracking-tight italic">Node Health</h2>
                  </div>
                  <Card className="p-8 rounded-[2rem] border-2 bg-card shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                      <div>
                        <p className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-1.5">CURRENT_LIFE</p>
                        <TierBadge tier={profile?.sellerTier} className="scale-150 origin-left border-none shadow-none bg-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-6 border-t pt-6">
                        <div>
                          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">ON_TIME_RATE</p>
                          <p className="text-2xl font-black text-green-600 tracking-tighter">{profile?.onTimeShippingRate ? Math.round(profile.onTimeShippingRate * 100) : 100}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">LATE_SHIPMENTS</p>
                          <p className={cn("text-2xl font-black tracking-tighter", (profile?.lateShipmentsLast30d || 0) > 0 ? "text-red-600" : "text-green-600")}>{profile?.lateShipmentsLast30d || 0}</p>
                        </div>
                      </div>
                      <Button onClick={handleCalculateTier} disabled={isCalculatingTier} className="w-full h-12 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-lg">
                        {isCalculatingTier ? <Loader2 className="animate-spin" /> : <TrendingUp className="w-4 h-4" />} Restore Health Protocol
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-zinc-900" />
                    <h2 className="text-xl font-headline font-black uppercase tracking-tight italic">Sales Activity</h2>
                  </div>
                  <Card className="p-6 h-[320px] rounded-[2rem] border shadow-lg flex flex-col">
                    <div className="flex-1 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: '900', fill: '#999'}} />
                          <YAxis hide />
                          <Tooltip contentStyle={{borderRadius: '12px', border: '2px solid #000', backgroundColor: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                          <Line type="stepAfter" dataKey="revenue" stroke="#DC2626" strokeWidth={4} dot={{r: 4, fill: '#DC2626', strokeWidth: 2, stroke: '#fff'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="pt-4 border-t mt-auto flex items-center justify-between">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">DAILY REVENUE (7 DAYS)</p>
                      <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white border-none font-black text-[8px] uppercase">LATEST</Badge>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}

          {isSeller && (
            <TabsContent value="sales" className="space-y-10">
              <div className="grid gap-3">
                {salesLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" /></div>
                ) : sales && sales.length > 0 ? sales.map(sale => (
                  <Card key={sale.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 rounded-xl border shadow-sm">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border">
                      {sale.imageUrl ? (
                        <Image src={sale.imageUrl} alt={sale.listingTitle} fill className="object-cover" />
                      ) : (
                        <Package className="w-5 h-5 m-auto opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <Badge variant="outline" className="mb-1 text-[7px] font-black uppercase border-accent text-accent tracking-widest h-4 px-2">
                        {sale.status}
                      </Badge>
                      <h4 className="font-black text-sm truncate uppercase tracking-tight italic leading-tight">{sale.listingTitle}</h4>
                      <p className="text-[8px] font-bold text-zinc-400 mt-0.5 uppercase">Order ID: #{sale.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <Button asChild size="sm" className="rounded-lg font-black h-10 px-6 text-[8px] uppercase shrink-0 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 transition-all shadow-md w-full sm:w-auto">
                      <Link href={`/orders/${sale.id}`}>Manage Fulfillment</Link>
                    </Button>
                  </Card>
                )) : (
                  <Card className="p-16 text-center border-2 border-dashed rounded-[2rem] bg-zinc-50/50 dark:bg-white/5">
                    <Cpu className="w-10 h-10 mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">No active sales.</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {isSeller && (
            <TabsContent value="payouts" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-8 rounded-[2rem] border bg-card shadow-lg relative group overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">TOTAL REVENUE</p>
                  <p className="text-4xl font-headline font-black text-primary dark:text-white italic tracking-tighter">${lifetimeEarnings.toFixed(2)}</p>
                </Card>
                <Card className="p-8 rounded-[2rem] border bg-card shadow-lg relative group overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">PENDING PAYOUT</p>
                  <p className="text-4xl font-headline font-black text-accent italic tracking-tighter">${pendingPayout.toFixed(2)}</p>
                </Card>
              </div>
              
              <Card className="relative overflow-hidden bg-zinc-950 text-white p-8 rounded-[2rem] border-none shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <CreditCard className="w-4 h-4 text-[#635BFF]" />
                      <h3 className="text-xl font-headline font-black uppercase italic tracking-tight">Stripe Payouts</h3>
                    </div>
                    <p className="text-zinc-400 font-medium italic text-[10px] max-w-sm">Secure payment infrastructure via Stripe Connect. Payouts are handled according to platform policy.</p>
                  </div>
                  <Button 
                    onClick={handleOpenPayoutHistory} 
                    className="w-full md:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] bg-white text-zinc-950 hover:bg-zinc-200 shadow-lg border-none shrink-0"
                  >
                    View Payout History
                  </Button>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Payout History Dialog */}
        <Dialog open={isPayoutHistoryOpen} onOpenChange={setIsPayoutHistoryOpen}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-zinc-950">
            <div className="bg-zinc-950 p-8 text-white border-b border-white/10">
              <DialogTitle className="text-2xl font-headline font-black uppercase italic tracking-tighter">Transaction Ledger</DialogTitle>
            </div>
            <div className="p-6 space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
              {isLoadingPayouts ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Fetching Stripe Records...</p>
                </div>
              ) : payoutHistory.length === 0 ? (
                <div className="py-16 text-center bg-white/5 rounded-[1.5rem] border-2 border-dashed border-white/10">
                  <p className="text-zinc-500 font-black uppercase text-[9px] tracking-widest">No records found.</p>
                </div>
              ) : (
                payoutHistory.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-xl font-black text-white tracking-tighter">${(payout.amount / 100).toFixed(2)}</p>
                      <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">ID: {payout.id.substring(0, 12).toUpperCase()}</p>
                    </div>
                    <Badge className="bg-green-600/20 text-green-500 border border-green-600/30 text-[8px] font-black uppercase tracking-widest px-3 h-6 rounded-full">
                      {payout.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
