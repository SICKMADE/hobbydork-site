      'use client';
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
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/**
 * DashboardContent - Only rendered once user is verified and active.
 * This prevents permission errors by ensuring queries only fire for authorized users.
 */
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

  // Security Rule Alignment: Only query if user is ACTIVE and verified
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

  // Calculate earnings
  const completedSales = sales?.filter(s => ['Delivered', 'Shipped'].includes(s.status)) || [];
  const refundedSales = sales?.filter(s => s.status === 'Refunded') || [];
  const lifetimeEarnings = completedSales.reduce((acc, s) => acc + (s.price || 0), 0);
  const refundedAmount = refundedSales.reduce((acc, s) => acc + (s.price || 0), 0);
  const pendingPayout = completedSales.filter(s => s.status === 'Shipped').reduce((acc, s) => acc + (s.price || 0), 0);

  const isSeller = profile?.isSeller && profile?.sellerStatus === 'APPROVED';
  const username = profile?.username || 'Collector';
  const shopUrl = `hobbydork.com/shop/${username}`;

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
      toast({ variant: 'destructive', title: 'Could not submit withdrawal request' });
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
      toast({ variant: 'destructive', title: 'Tier calculation failed', description: error.message });
    } finally {
      setIsCalculatingTier(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
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

      {/* Tabs */}

      {/* Desktop Tabs */}
      <Tabs defaultValue="collector" className="w-full">
        <TabsList className="dashboard-tabs bg-muted p-1 h-14 rounded-xl px-2 mb-8 flex-nowrap overflow-x-auto justify-start md:justify-center scrollbar-hide hidden sm:flex" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TabsTrigger value="collector" className="rounded-lg px-8 h-10 font-bold shrink-0">Collector Hub</TabsTrigger>
          {isSeller && <TabsTrigger value="dealer" className="rounded-lg px-8 h-10 font-bold shrink-0">Seller Hub</TabsTrigger>}
          {isSeller && <TabsTrigger value="sales" className="rounded-lg px-8 h-10 font-bold shrink-0">Sales & Shipping</TabsTrigger>}
          {isSeller && <TabsTrigger value="payouts" className="rounded-lg px-8 h-10 font-bold shrink-0">Payouts</TabsTrigger>}
        </TabsList>

        {/* Mobile Bottom Tabs */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex sm:hidden justify-around h-16 shadow-lg">
          <TabsTrigger value="collector" className="flex flex-col items-center justify-center flex-1 h-full font-bold text-xs focus:outline-none data-[state=active]:text-accent">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V7H7v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2z"/></svg>
            Collector
          </TabsTrigger>
          {isSeller && (
            <TabsTrigger value="dealer" className="flex flex-col items-center justify-center flex-1 h-full font-bold text-xs focus:outline-none data-[state=active]:text-accent">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21V7a2 2 0 0 0-2-2h-4V3a1 1 0 0 0-2 0v2H6a2 2 0 0 0-2 2v14"/></svg>
              Seller
            </TabsTrigger>
          )}
          {isSeller && (
            <TabsTrigger value="sales" className="flex flex-col items-center justify-center flex-1 h-full font-bold text-xs focus:outline-none data-[state=active]:text-accent">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><path d="M16 11V7a4 4 0 0 0-8 0v4"/></svg>
              Sales
            </TabsTrigger>
          )}
          {isSeller && (
            <TabsTrigger value="payouts" className="flex flex-col items-center justify-center flex-1 h-full font-bold text-xs focus:outline-none data-[state=active]:text-accent">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
              Payouts
            </TabsTrigger>
          )}
        </div>

        {/* Collector Tab */}
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

        {/* Seller Tab */}
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
                
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Sales</p>
                    <p className="text-xl sm:text-2xl font-black">{profile?.tierMetrics?.completedSales || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Returns</p>
                    <p className="text-xl sm:text-2xl font-black">{profile?.tierMetrics?.returnRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Refunds</p>
                    <p className="text-xl sm:text-2xl font-black">{profile?.tierMetrics?.refundRate || 0}%</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3">Tier Levels</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { tier: 'Bronze', desc: 'New' },
                      { tier: 'Silver', desc: '50+ sales' },
                      { tier: 'Gold', desc: '200+ sales' },
                      { tier: 'Platinum', desc: 'Elite' }
                    ].map(benefit => (
                      <div key={benefit.tier} className={`p-3 rounded-lg border ${
                        profile?.sellerTier === benefit.tier ? 'bg-accent/10 border-accent' : 'bg-muted/30 border-muted'
                      }`}>
                        <p className="font-bold text-sm mb-1">{benefit.tier}</p>
                        <p className="text-xs text-muted-foreground font-medium">{benefit.desc}</p>
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
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Lifetime</p>
                      <p className="text-3xl font-black text-accent">${lifetimeEarnings.toFixed(2)}</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-xl"><Wallet className="w-6 h-6 text-accent" /></div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Total from completed sales</p>
                </Card>

                <Card className="p-6 rounded-xl border bg-gradient-to-br from-card to-card/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Pending</p>
                      <p className="text-3xl font-black text-accent">${pendingPayout.toFixed(2)}</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-xl"><Package className="w-6 h-6 text-accent" /></div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">3-day hold for protection</p>
                </Card>
              </div>

              <Card className="p-6 rounded-xl border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black uppercase text-base tracking-wider text-primary mb-1">Stripe Connect</h3>
                    <p className="text-sm text-muted-foreground font-medium">Manage payouts & withdrawals</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 font-black uppercase text-xs px-3 py-1">Connected</Badge>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="default" className="flex-1 rounded-lg h-11 font-bold uppercase text-sm" onClick={handleOpenPayoutHistory}>
                    History
                  </Button>
                  <Button size="default" className="flex-1 rounded-lg h-11 font-bold uppercase text-sm" onClick={() => setIsWithdrawalOpen(true)}>
                    Withdraw
                  </Button>
                </div>
              </Card>

              <div className="space-y-3">
                <h3 className="font-black uppercase text-xs tracking-wider text-muted-foreground">Recent Transactions</h3>
                {completedSales && completedSales.length > 0 ? (
                  <div className="space-y-2">
                    {completedSales.slice(0, 8).map(tx => (
                      <Card key={tx.id} className="p-4 rounded-xl border hover:border-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-xs font-mono font-bold text-muted-foreground">#{tx.id.substring(0, 8).toUpperCase()}</code>
                              <Badge 
                                variant="outline" 
                                className={`text-[9px] font-black uppercase ${
                                  tx.status === 'Delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                                  tx.status === 'Refunded' ? 'bg-red-100 text-red-700 border-red-200' :
                                  'bg-blue-100 text-blue-700 border-blue-200'
                                }`}
                              >
                                {tx.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-bold text-muted-foreground truncate">@{tx.buyerName || 'Collector'}</p>
                          </div>
                          <p className="text-base font-black text-accent shrink-0">${(tx.price || 0).toFixed(2)}</p>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-3 text-xs font-bold rounded-lg shrink-0">
                            <Link href={`/orders/${tx.id}`}>View</Link>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-10 text-center border-2 border-dashed rounded-xl">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground">No transactions yet</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

        <Dialog open={isPayoutHistoryOpen} onOpenChange={setIsPayoutHistoryOpen}>
          <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl">
            <div className="p-6 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Payout History</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Recent Stripe payouts</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-2 max-h-[400px] overflow-y-auto">
              {isLoadingPayouts ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-accent mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Loading</p>
                </div>
              ) : payoutHistory.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-xl">
                  <p className="text-sm font-bold text-muted-foreground">No history yet</p>
                </div>
              ) : (
                payoutHistory.map((payout) => (
                  <Card key={payout.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-[9px] font-mono font-bold text-muted-foreground">#{payout.id?.substring(0, 10)?.toUpperCase()}</code>
                      <p className="text-sm font-black text-accent">${((payout.amount || 0) / 100).toFixed(2)}</p>
                      <Badge variant="outline" className="text-[8px] font-black uppercase">{payout.status || 'pending'}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
          <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl">
            <div className="p-6 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Withdraw Funds</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Request payout from available balance</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-black text-accent">${pendingPayout.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">Amount (USD)</p>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="h-11 rounded-lg font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 h-10 rounded-lg font-bold" onClick={() => setIsWithdrawalOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 h-10 rounded-lg font-bold" onClick={handleRequestWithdrawal} disabled={isSubmittingWithdrawal}>
                  {isSubmittingWithdrawal ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
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
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.emailVerified) {
      router.push('/verify-email');
      return;
    }
    
    // Only redirect to onboarding if we've confirmed profile doesn't exist
    if (!profile) {
      router.push('/onboarding');
      return;
    }
    
    // Only redirect if profile exists but has no username
    if (profile && !profile.username) {
      router.push('/onboarding');
      return;
    }
  }, [user, profile, isVerificationComplete]);

  if (!isVerificationComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opening Vault</p>
      </div>
    );
  }

  // Identity Gate: Prevent query firing if not verified/active
  if (!user || !profile || !user.emailVerified || profile.status !== 'ACTIVE') {
    if (user && !user.emailVerified) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6 rounded-[2rem]">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-headline font-black uppercase italic">Identity Verification Required</h2>
            <p className="text-muted-foreground">Please verify your email address to access your collector dashboard.</p>
            <Button asChild className="w-full h-12 bg-accent text-accent-foreground rounded-xl">
              <Link href="/verify-email">Go to Verification</Link>
            </Button>
          </Card>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <DashboardContent profile={profile} user={user} />
      </main>
    </div>
  );
}
