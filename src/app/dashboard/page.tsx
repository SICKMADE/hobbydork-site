'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Copy, 
  Loader2, 
  Truck, 
  Gift, 
  Package, 
  Settings,
  Palette,
  ShieldCheck,
  Mail,
  Wallet,
  Medal,
  Sparkles,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

function DashboardContent({ profile, user }: { profile: any, user: any }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isPayoutHistoryOpen, setIsPayoutHistoryOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isCalculatingTier, setIsCalculatingTier] = useState(false);

  const isSeller = profile?.isSeller && profile?.sellerStatus === 'APPROVED';
  const username = profile?.username || 'Collector';
  const shopUrl = `hobbydork.com/shop/${username}`;

  const ordersQuery = useMemoFirebase(() => query(
    collection(db!, 'orders'), 
    where('buyerUid', '==', user.uid), 
    orderBy('createdAt', 'desc'),
    limit(20)
  ), [db, user.uid]);

  const salesQuery = useMemoFirebase(() => query(
    collection(db!, 'orders'), 
    where('sellerUid', '==', user.uid), 
    orderBy('createdAt', 'desc'),
    limit(20)
  ), [db, user.uid]);

  const { data: orders } = useCollection(ordersQuery);
  const { data: sales } = useCollection(salesQuery);

  const draftListingsQuery = useMemoFirebase(() => 
    isSeller ? query(
      collection(db!, 'listings'),
      where('listingSellerId', '==', user.uid),
      where('visibility', '==', 'Invisible'),
      orderBy('createdAt', 'desc')
    ) : null
  , [db, user.uid, isSeller]);

  const { data: draftListings } = useCollection(draftListingsQuery);

  const completedSales = sales?.filter(s => ['Delivered', 'Shipped'].includes(s.status)) || [];
  const lifetimeEarnings = completedSales.reduce((acc, s) => acc + (s.price || 0), 0);
  const pendingPayout = completedSales.filter(s => s.status === 'Shipped').reduce((acc, s) => acc + (s.price || 0), 0);

  const handleOpenPayoutHistory = async () => {
    if (!profile?.stripeAccountId) {
      toast({ variant: 'destructive', title: 'Stripe account not connected' });
      return;
    }

    setIsLoadingPayouts(true);
    setIsPayoutHistoryOpen(true);
    try {
      const getStripePayouts = httpsCallable(functions, 'getStripePayouts');
      const result: any = await getStripePayouts({ accountId: profile.stripeAccountId });
      setPayoutHistory(result?.data?.payouts || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load payout history' });
      setPayoutHistory([]);
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = Number(withdrawalAmount);
    if (!db) return;

    if (!amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Enter a valid amount' });
      return;
    }

    if (amount > pendingPayout) {
      toast({ variant: 'destructive', title: 'Amount exceeds pending payout' });
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      await addDoc(collection(db, 'payoutRequests'), {
        sellerUid: user.uid,
        sellerUsername: username,
        stripeAccountId: profile?.stripeAccountId || null,
        amount,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setWithdrawalAmount('');
      setIsWithdrawalOpen(false);
      toast({ title: 'Withdrawal request submitted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not submit withdrawal request', description: 'Please try again.' });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleCalculateTier = async () => {
    setIsCalculatingTier(true);
    try {
      const calculateSellerTier = httpsCallable(functions, 'calculateSellerTier');
      const result: any = await calculateSellerTier({});
      toast({ title: `Tier Updated: ${result.data.tier}`, description: `You are now tier ${result.data.tier}!` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Tier Update Failed', description: getFriendlyErrorMessage(error) });
    } finally {
      setIsCalculatingTier(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-black uppercase tracking-tight italic">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium">@{username}</p>
        </div>
        
        {isSeller && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg w-full sm:w-auto overflow-hidden">
              <code className="text-[11px] font-mono font-bold text-muted-foreground truncate">{shopUrl}</code>
              <Button variant="ghost" size="icon" onClick={() => {navigator.clipboard.writeText(shopUrl); toast({title: 'Copied!'})}} className="h-7 w-7 hover:bg-accent/10 shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button asChild variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase hover:bg-accent/10 flex-1 sm:flex-initial">
                <Link href={`/shop/${username}`}>View</Link>
              </Button>
              <Button asChild size="sm" className="h-7 px-3 text-[10px] font-bold uppercase gap-1 flex-1 sm:flex-initial">
                <Link href="/seller/settings"><Palette className="w-3 h-3" />Edit</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="collector" className="w-full">
        <TabsList className="dashboard-tabs bg-muted p-1 h-14 rounded-xl px-2 mb-8 flex-nowrap overflow-x-auto justify-start md:justify-center scrollbar-hide hidden sm:flex">
          <TabsTrigger value="collector" className="rounded-lg px-8 h-10 font-bold shrink-0">Collector Hub</TabsTrigger>
          {isSeller && <TabsTrigger value="dealer" className="rounded-lg px-8 h-10 font-bold shrink-0">Seller Hub</TabsTrigger>}
          {isSeller && <TabsTrigger value="sales" className="rounded-lg px-8 h-10 font-bold shrink-0">Sales & Shipping</TabsTrigger>}
          {isSeller && <TabsTrigger value="payouts" className="rounded-lg px-8 h-10 font-bold shrink-0">Payouts</TabsTrigger>}
        </TabsList>

        <TabsContent value="collector" className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 rounded-xl border bg-gradient-to-br from-card to-card/50">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-2">Purchased</p>
              <h3 className="text-2xl font-black">{orders?.length || 0}</h3>
            </Card>
            <Card className="p-5 rounded-xl border bg-gradient-to-br from-card to-card/50">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-2">In Transit</p>
              <h3 className="text-2xl font-black">{orders?.filter(o => o.status !== 'Delivered').length || 0}</h3>
            </Card>
            <Card className="p-5 rounded-xl border bg-gradient-to-br from-card to-card/50">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-2">Total Spent</p>
              <h3 className="text-2xl font-black">${orders?.reduce((acc, o) => acc + (o.price || 0), 0).toLocaleString()}</h3>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-black uppercase tracking-tight">Recent Orders</h2>
            </div>
            <div className="space-y-3">
              {orders && orders.length > 0 ? orders.map(order => (
                <Card key={order.id} className="p-4 flex items-center gap-4 rounded-xl border hover:border-accent/50 transition-colors">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border">
                    {order.imageUrl ? <Image src={order.imageUrl} alt={order.listingTitle} fill className="object-cover" /> : <Package className="w-5 h-5 m-auto opacity-20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-[9px] font-black uppercase">{order.status}</Badge>
                    <h4 className="font-bold text-sm truncate">{order.listingTitle}</h4>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-lg font-bold h-8 px-3 text-[10px] uppercase shrink-0">
                    <Link href={`/orders/${order.id}`}>Track</Link>
                  </Button>
                </Card>
              )) : (
                <Card className="p-10 text-center border-2 border-dashed rounded-xl">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold text-muted-foreground">No orders yet</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {isSeller && (
          <TabsContent value="dealer" className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-black uppercase tracking-tight">Seller Status</h2>
              </div>
              
              <Card className="p-4 sm:p-6 rounded-xl border bg-gradient-to-br from-accent/5 to-transparent">
                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">Current Tier</p>
                    <p className="text-3xl sm:text-4xl font-headline font-black italic">{profile?.sellerTier || 'Bronze'}</p>
                  </div>
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-accent/20" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Sales</p>
                    <p className="text-xl sm:text-2xl font-black">{profile?.completedOrders || 0}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">On-Time Rate</p>
                    <p className="text-xl sm:text-2xl font-black text-green-600">
                      {profile?.onTimeShippingRate ? Math.round(profile.onTimeShippingRate * 100) : 100}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Late (30d)</p>
                    <p className={`text-xl sm:text-2xl font-black ${
                      (profile?.lateShipmentsLast30d || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>{profile?.lateShipmentsLast30d || 0}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3">Tier Levels</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Bronze', 'Silver', 'Gold', 'Platinum'].map(tier => (
                      <div key={tier} className={`p-3 rounded-lg border ${
                        profile?.sellerTier === tier ? 'bg-accent/10 border-accent' : 'bg-muted/30 border-muted'
                      }`}>
                        <p className="font-bold text-sm mb-1">{tier}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Button 
                onClick={handleCalculateTier} 
                disabled={isCalculatingTier}
                className="w-full font-bold h-10 rounded-lg text-[10px] uppercase gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isCalculatingTier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isCalculatingTier ? 'Calculating...' : 'Refresh Tier'}
              </Button>
            </div>

            {draftListings && draftListings.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-black uppercase tracking-tight">Invisible Listings</h2>
                  </div>
                  <Badge variant="secondary" className="font-black uppercase text-[9px]">
                    {draftListings.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {draftListings.map(listing => (
                    <Card key={listing.id} className="p-4 flex items-center gap-4 rounded-xl border hover:border-accent/50 transition-colors">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border">
                        {listing.imageUrl ? <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" /> : <Package className="w-5 h-5 m-auto opacity-20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px] font-black uppercase">
                            {listing.visibility}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm truncate">{listing.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium">${listing.price?.toLocaleString()}</p>
                      </div>
                      <Button asChild size="sm" className="rounded-lg font-bold h-8 px-3 text-[10px] uppercase shrink-0">
                        <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {isSeller && (
          <TabsContent value="sales" className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-black uppercase tracking-tight">Sales & Shipping</h2>
              </div>

              <div className="space-y-3">
                {sales && sales.length > 0 ? sales.map(sale => (
                  <Card key={sale.id} className="p-4 flex items-center gap-4 rounded-xl border hover:border-accent/50 transition-colors">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border">
                      {sale.imageUrl ? <Image src={sale.imageUrl} alt={sale.listingTitle} fill className="object-cover" /> : <Package className="w-5 h-5 m-auto opacity-20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] font-black uppercase">{sale.status}</Badge>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">@{sale.buyerName || 'Collector'}</span>
                      </div>
                      <h4 className="font-bold text-sm truncate">{sale.listingTitle}</h4>
                    </div>
                    <Button asChild size="sm" className="rounded-lg font-bold h-8 px-3 text-[10px] uppercase shrink-0">
                      <Link href={`/orders/${sale.id}`}>Manage</Link>
                    </Button>
                  </Card>
                )) : (
                  <Card className="p-10 text-center border-2 border-dashed rounded-xl">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground">No sales yet</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {isSeller && (
          <TabsContent value="payouts" className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-black uppercase tracking-tight">Earnings</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 rounded-xl border bg-gradient-to-br from-card to-card/50">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Lifetime</p>
                  <p className="text-3xl font-black text-accent">${lifetimeEarnings.toFixed(2)}</p>
                </Card>
                <Card className="p-6 rounded-xl border bg-gradient-to-br from-card to-card/50">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Pending</p>
                  <p className="text-3xl font-black text-accent">${pendingPayout.toFixed(2)}</p>
                </Card>
              </div>

              <Card className="p-6 rounded-xl border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black uppercase text-base tracking-wider text-primary mb-1">Stripe Connect</h3>
                    <p className="text-sm text-muted-foreground font-medium">Manage payouts</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 font-black uppercase text-xs">Connected</Badge>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleOpenPayoutHistory}>History</Button>
                  <Button className="flex-1" onClick={() => setIsWithdrawalOpen(true)}>Withdraw</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={isPayoutHistoryOpen} onOpenChange={setIsPayoutHistoryOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Payout History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoadingPayouts ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : payoutHistory.length === 0 ? (
              <p className="text-center text-muted-foreground">No history yet</p>
            ) : (
              payoutHistory.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="text-sm font-black text-accent">${(payout.amount / 100).toFixed(2)}</p>
                  <Badge variant="outline" className="text-[8px] font-black uppercase">{payout.status}</Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="Amount"
            />
            <Button className="w-full" onClick={handleRequestWithdrawal} disabled={isSubmittingWithdrawal}>
              {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isVerificationComplete = !authLoading && !profileLoading;

  useEffect(() => {
    if (!isVerificationComplete) return;
    if (!user) router.push('/login');
    else if (!user.emailVerified) router.push('/verify-email');
    else if (!profile?.username) router.push('/onboarding');
  }, [user, profile, isVerificationComplete, router]);

  if (!isVerificationComplete) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user || !profile || !user.emailVerified) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <DashboardContent profile={profile} user={user} />
      </main>
    </div>
  );
}