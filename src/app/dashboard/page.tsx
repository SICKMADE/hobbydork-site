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
  Mail
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/**
 * DashboardContent - Only rendered once user is verified and active.
 * This prevents permission errors by ensuring queries only fire for authorized users.
 */
function DashboardContent({ profile, user }: { profile: any, user: any }) {
  const { toast } = useToast();
  const db = useFirestore();

  // Security Rule Alignment: Only query if user is ACTIVE and verified
  const ordersQuery = useMemoFirebase(() => query(
    collection(db!, 'orders'), 
    where('buyerUid', '==', user.uid), 
    orderBy('timestamp', 'desc'),
    limit(20)
  ), [db, user.uid]);

  const salesQuery = useMemoFirebase(() => query(
    collection(db!, 'orders'), 
    where('sellerUid', '==', user.uid), 
    orderBy('timestamp', 'desc'),
    limit(20)
  ), [db, user.uid]);

  const { data: orders } = useCollection(ordersQuery);
  const { data: sales } = useCollection(salesQuery);

  const isSeller = profile?.isSeller && profile?.sellerStatus === 'APPROVED';
  const username = profile?.username || 'Collector';
  const shopUrl = `hobbydork.com/shop/${username}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter italic">My Dashboard</h1>
          <p className="text-muted-foreground font-medium">Welcome back, @{username}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-accent text-white hover:bg-accent/90 h-12 rounded-xl px-8 font-bold shadow-lg">
            <Link href="/listings/create" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> New Listing
            </Link>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="collector" className="w-full">
        <TabsList className="bg-muted p-1 h-14 rounded-xl px-2 mb-8 flex-nowrap overflow-x-auto justify-start md:justify-center">
          <TabsTrigger value="collector" className="rounded-lg px-8 h-10 font-bold shrink-0">Collector Hub</TabsTrigger>
          {isSeller && <TabsTrigger value="dealer" className="rounded-lg px-8 h-10 font-bold shrink-0">Seller Hub</TabsTrigger>}
        </TabsList>

        <TabsContent value="collector" className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-card p-6 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Purchased Items</p>
              <h3 className="text-3xl font-black">{orders?.length || 0}</h3>
            </Card>
            <Card className="border-none shadow-sm bg-card p-6 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Active Deliveries</p>
              <h3 className="text-3xl font-black">{orders?.filter(o => o.status !== 'Delivered').length || 0}</h3>
            </Card>
            <Card className="border-none shadow-sm bg-card p-6 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Total Spent</p>
              <h3 className="text-3xl font-black">${orders?.reduce((acc, o) => acc + (o.price || 0), 0).toLocaleString()}</h3>
            </Card>
          </div>

          <section className="space-y-6">
             <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
               <Truck className="w-6 h-6 text-accent" /> Recent Orders
             </h2>
             <div className="grid gap-4">
               {orders && orders.length > 0 ? orders.map(order => (
                 <Card key={order.id} className="p-4 flex items-center gap-6 rounded-2xl border shadow-sm">
                   <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border bg-muted">
                     {order.imageUrl ? <Image src={order.imageUrl} alt={order.listingTitle} fill className="object-cover" /> : <Package className="w-6 h-6 m-auto opacity-20" />}
                   </div>
                   <div className="flex-1">
                      <Badge variant="outline" className="mb-1 text-[10px] font-black uppercase">{order.status}</Badge>
                      <h4 className="font-bold text-sm">{order.listingTitle}</h4>
                   </div>
                   <Button asChild variant="outline" className="rounded-xl font-bold h-10 px-6">
                     <Link href={`/orders/${order.id}`}>Track Order</Link>
                   </Button>
                 </Card>
               )) : (
                 <div className="p-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground font-bold">No orders yet.</div>
               )}
             </div>
          </section>
        </TabsContent>

        {isSeller && (
          <TabsContent value="dealer" className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 space-y-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-black uppercase text-xs tracking-widest text-zinc-500">Shop Identity</h3>
                    <p className="text-2xl font-headline font-black text-primary italic">@{username}</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent">
                    <Link href="/seller/settings">
                      <Settings className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                  <code className="flex-1 text-xs font-bold truncate">{shopUrl}</code>
                  <Button variant="ghost" size="icon" onClick={() => {navigator.clipboard.writeText(shopUrl); toast({title: 'Copied!'})}} className="h-8 w-8 text-muted-foreground"><Copy className="w-4 h-4" /></Button>
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline" className="flex-1 font-black h-12 rounded-xl border-2 uppercase text-[10px] tracking-widest"><Link href={`/shop/${username}`}>View Public Shop</Link></Button>
                  <Button asChild className="flex-1 font-black h-12 rounded-xl bg-primary text-white uppercase text-[10px] tracking-widest gap-2 shadow-lg">
                    <Link href="/seller/settings"><Palette className="w-4 h-4" /> Customize Shop</Link>
                  </Button>
                </div>
              </Card>
              <Card className="p-8 space-y-4 bg-zinc-950 text-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-black uppercase text-xs tracking-widest text-white/50">Drop Console</h3>
                  <Gift className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-medium text-white/60">Launch community events to reward your followers and boost visibility.</p>
                </div>
                <Button asChild className="w-full bg-accent text-white hover:bg-accent/90 font-black h-12 rounded-xl uppercase tracking-widest shadow-lg"><Link href="/giveaways/create">New Giveaway</Link></Button>
              </Card>
            </div>

            <section className="space-y-6">
               <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
                 <Package className="w-6 h-6 text-accent" /> Sales & Shipping
               </h2>
               <div className="grid gap-4">
                 {sales && sales.length > 0 ? sales.map(sale => (
                   <Card key={sale.id} className="p-4 flex items-center gap-6 rounded-2xl border shadow-sm">
                     <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border bg-muted">
                       {sale.imageUrl ? <Image src={sale.imageUrl} alt={sale.listingTitle} fill className="object-cover" /> : <Package className="w-6 h-6 m-auto opacity-20" />}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-black uppercase">{sale.status}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Buyer: @{sale.buyerName || 'Collector'}</span>
                        </div>
                        <h4 className="font-bold text-sm">{sale.listingTitle}</h4>
                     </div>
                     <Button asChild className="rounded-xl font-black h-10 px-6 gap-2">
                       <Link href={`/orders/${sale.id}`}>Manage Shipment</Link>
                     </Button>
                   </Card>
                 )) : (
                   <div className="p-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground font-bold">No sales yet.</div>
                 )}
               </div>
            </section>
          </TabsContent>
        )}
      </Tabs>
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
            <Button asChild className="w-full h-12 bg-accent text-white rounded-xl">
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
