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
  Ban
} from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  limit
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * AdminPanelContent - Isolated data fetching for Staff only.
 * This prevents non-staff users from triggering permission errors during auth transitions.
 */
function AdminPanelContent({ isStaff }: { isStaff: boolean }) {
  const { toast } = useToast();
  const db = useFirestore();

  // Queries only fire if sub-component is rendered (which requires isStaff check in parent)
  const reportsQuery = useMemoFirebase(() => query(collection(db!, 'reports'), orderBy('timestamp', 'desc')), [db]);
  const usersQuery = useMemoFirebase(() => collection(db!, 'users'), [db]);
  const ordersQuery = useMemoFirebase(() => query(collection(db!, 'orders'), orderBy('timestamp', 'desc'), limit(100)), [db]);
  const listingsQuery = useMemoFirebase(() => collection(db!, 'listings'), [db]);
  const giveawaysQuery = useMemoFirebase(() => collection(db!, 'giveaways'), [db]);

  const { data: reports, isLoading: reportsLoading } = useCollection(reportsQuery);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);
  const { data: giveaways } = useCollection(giveawaysQuery);

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db!, 'users', userId), { status });
      toast({ title: `User ${status}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db!, 'reports', reportId), { status: 'RESOLVED' });
      toast({ title: "Report Resolved" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleDeleteContent = async (type: 'listings' | 'giveaways', id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this content?')) return;
    try {
      await deleteDoc(doc(db!, type, id));
      toast({ title: "Content Removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  const totalGMV = useMemo(() => {
    return orders?.reduce((acc, order) => acc + (order.price || 0), 0) || 0;
  }, [orders]);

  return (
    <Tabs defaultValue="overview" className="space-y-10 animate-in fade-in duration-500">
      <TabsList className="bg-zinc-200/50 dark:bg-zinc-900 p-1 h-14 rounded-xl px-2 border overflow-x-auto justify-start md:justify-center flex-nowrap scrollbar-hide">
        <TabsTrigger value="overview" className="rounded-lg px-8 h-10 font-bold shrink-0">Overview</TabsTrigger>
        <TabsTrigger value="marketplace" className="rounded-lg px-8 h-10 font-bold shrink-0">Disputes</TabsTrigger>
        <TabsTrigger value="moderation" className="rounded-lg px-8 h-10 font-bold shrink-0">Moderation</TabsTrigger>
        <TabsTrigger value="reports" className="rounded-lg px-8 h-10 font-bold shrink-0">Reports</TabsTrigger>
        <TabsTrigger value="users" className="rounded-lg px-8 h-10 font-bold shrink-0">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Platform GMV', val: `$${totalGMV.toLocaleString()}`, icon: TrendingUp },
            { label: 'Total Users', val: users?.length || 0, icon: UserCheck },
            { label: 'Active Listings', val: listings?.length || 0, icon: ShoppingBag },
            { label: 'Active Drops', val: giveaways?.length || 0, icon: Gift },
          ].map((stat, i) => (
            <Card key={i} className="p-6 border-none shadow-sm rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-3xl font-black mt-1">{stat.val}</h3>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="marketplace">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Order ID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Value</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Parties</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ordersLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : orders?.filter(o => o.status === 'Disputed' || o.status === 'Return Requested').length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground font-bold italic">No active disputes requiring intervention.</td></tr>
                ) : orders?.filter(o => o.status === 'Disputed' || o.status === 'Return Requested').map(order => (
                  <tr key={order.id} className="bg-amber-50/30">
                    <td className="p-4"><code className="text-xs font-bold font-mono">#{order.id.substring(0, 8)}</code></td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500 text-amber-600 bg-amber-50">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-bold">${order.price?.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="text-[10px] font-bold uppercase text-zinc-500">
                        B: @{order.buyerName || '...'} <br/>
                        S: @{order.sellerName || '...'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button asChild className="bg-zinc-950 text-white rounded-lg h-8 px-4 font-black text-[10px] uppercase">
                        <Link href={`/orders/${order.id}`}>Review Case</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="moderation">
        <div className="grid gap-8">
          <section className="space-y-4">
            <h3 className="font-headline font-black text-xl uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-accent" /> Active Listings
            </h3>
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b">
                    <tr>
                      <th className="p-4 uppercase font-black tracking-widest">Item</th>
                      <th className="p-4 uppercase font-black tracking-widest">Seller</th>
                      <th className="p-4 uppercase font-black tracking-widest">Price</th>
                      <th className="p-4 text-right uppercase font-black tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {listingsLoading ? (
                      <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                    ) : listings?.map(l => (
                      <tr key={l.id} className="group hover:bg-zinc-50 transition-colors">
                        <td className="p-4 font-bold">{l.title}</td>
                        <td className="p-4 text-zinc-500 font-medium">@{l.sellerName}</td>
                        <td className="p-4 font-black">${l.price?.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                              <Link href={`/listings/${l.id}`}><Eye className="w-4 h-4" /></Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteContent('listings', l.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="font-headline font-black text-xl uppercase tracking-tight flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent" /> Community Drops
            </h3>
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b">
                    <tr>
                      <th className="p-4 uppercase font-black tracking-widest">Prize</th>
                      <th className="p-4 uppercase font-black tracking-widest">Seller</th>
                      <th className="p-4 uppercase font-black tracking-widest">Entries</th>
                      <th className="p-4 text-right uppercase font-black tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {giveaways?.map(g => (
                      <tr key={g.id} className="group hover:bg-zinc-50 transition-colors">
                        <td className="p-4 font-bold">{g.title}</td>
                        <td className="p-4 text-zinc-500 font-medium">@{g.sellerName}</td>
                        <td className="p-4 font-black">{g.entriesCount || 0}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                              <Link href={`/giveaways/${g.id}`}><Eye className="w-4 h-4" /></Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteContent('giveaways', g.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="reports">
        <div className="grid gap-4">
          {reportsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-accent" /></div>
          ) : reports?.filter(r => r.status === 'PENDING').length === 0 ? (
            <div className="py-20 text-center border-4 border-dashed rounded-[2rem] space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-black uppercase text-xs">All reports resolved.</p>
            </div>
          ) : reports?.filter(r => r.status === 'PENDING').map(r => (
            <Card key={r.id} className="p-6 border-none shadow-sm rounded-2xl group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "uppercase font-black text-[8px] tracking-[0.2em]",
                      r.type === 'Order' ? "bg-red-600" : "bg-primary"
                    )}>
                      {r.type}
                    </Badge>
                  </div>
                  <h4 className="font-black text-lg">@{r.reportedName}</h4>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{r.reason}</p>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">"{r.details}"</p>
                  <div className="pt-2 text-[9px] font-bold text-zinc-400 uppercase">
                    Reported by: @{r.reporterName} • {r.timestamp?.toDate ? new Date(r.timestamp.toDate()).toLocaleString() : 'Just now'}
                  </div>
                </div>
                <Button onClick={() => handleResolveReport(r.id)} className="bg-zinc-950 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase">Mark Resolved</Button>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="users">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">User</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Role</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usersLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : users?.map(u => (
                  <tr key={u.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-black text-xs">{u.username?.[0]?.toUpperCase()}</div>
                        <div>
                          <p className="font-bold text-sm">@{u.username}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase",
                        u.status === 'BANNED' ? "bg-red-600" : "bg-green-600"
                      )}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-[10px] font-black uppercase tracking-widest">{u.role}</td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 font-black text-[10px] uppercase text-red-600 hover:bg-red-50" 
                        onClick={() => handleUpdateUserStatus(u.id, u.status === 'BANNED' ? 'ACTIVE' : 'BANNED')}
                      >
                        {u.status === 'BANNED' ? <UserCheck className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                        {u.status === 'BANNED' ? 'Unban' : 'Ban'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();

  const profileRef = useMemoFirebase(() => currentUser && db ? doc(db, 'users', currentUser.uid) : null, [db, currentUser?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isVerificationComplete = !isUserLoading && !profileLoading;
  const isStaff = !!(profile && (profile.role === 'ADMIN' || profile.role === 'MODERATOR'));
  const isVerified = !!(currentUser && currentUser.emailVerified);

  useEffect(() => {
    if (isVerificationComplete) {
      if (!currentUser) {
        router.push('/login');
      } else if (!isVerified) {
        router.push('/verify-email');
      } else if (!isStaff) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have administrative privileges.'
        });
        router.push('/');
      }
    }
  }, [currentUser, isVerificationComplete, isStaff, isVerified, router, toast]);

  if (!isVerificationComplete) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  // Final Gate: Only render the content component (which triggers queries) if user is Staff
  if (!currentUser || !isStaff || !isVerified) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600 font-black tracking-widest text-[10px] uppercase">
              <ShieldAlert className="w-3 h-3" /> System Access
            </div>
            <h1 className="text-4xl font-headline font-black tracking-tight text-primary uppercase italic">Staff Command</h1>
            <p className="text-muted-foreground font-medium">Platform oversight, content moderation, and dispute resolution.</p>
          </div>
        </header>

        <AdminPanelContent isStaff={isStaff} />
      </main>
    </div>
  );
}
