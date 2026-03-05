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
  Crown
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
  where
} from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { httpsCallable } from 'firebase/functions';
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
  const functions = db ? getFunctions(db.app) : undefined; // Initialize functions using getFunctions

  // Queries only fire if sub-component is rendered (which requires isStaff check in parent)
  const reportsQuery = useMemoFirebase(() => query(collection(db!, 'reports'), orderBy('timestamp', 'desc')), [db]);
  const usersQuery = useMemoFirebase(() => collection(db!, 'users'), [db]);
  const ordersQuery = useMemoFirebase(() => query(collection(db!, 'orders'), orderBy('timestamp', 'desc'), limit(100)), [db]);
  const listingsQuery = useMemoFirebase(() => collection(db!, 'listings'), [db]);
  const giveawaysQuery = useMemoFirebase(() => collection(db!, 'giveaways'), [db]);
  const payoutRequestsQuery = useMemoFirebase(() => query(collection(db!, 'payoutRequests'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc')), [db]);
  const communityMessagesQuery = useMemoFirebase(() => query(collection(db!, 'communityMessages'), orderBy('createdAt', 'desc'), limit(50)), [db]);
  const iso24PostsQuery = useMemoFirebase(() => query(collection(db!, 'iso24Posts'), orderBy('createdAt', 'desc'), limit(50)), [db]);
  const spotlightQuery = useMemoFirebase(() => collection(db!, 'storeSpotlights'), [db]);

  const { data: reports, isLoading: reportsLoading } = useCollection(reportsQuery);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);
  const { data: giveaways } = useCollection(giveawaysQuery);
  const { data: payoutRequests, isLoading: payoutRequestsLoading } = useCollection(payoutRequestsQuery);
  const { data: communityMessages, isLoading: messagesLoading } = useCollection(communityMessagesQuery);
  const { data: iso24Posts, isLoading: postsLoading } = useCollection(iso24PostsQuery);
  const { data: spotlights, isLoading: spotlightsLoading } = useCollection(spotlightQuery);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [spotlightDialogOpen, setSpotlightDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<{ uid: string; username: string } | null>(null);
  const [spotlightDays, setSpotlightDays] = useState('7');
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; username: string } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [selectedFeeUser, setSelectedFeeUser] = useState<{ uid: string; username: string; currentFee: number | null; tier: string } | null>(null);
  const [newFeePercentage, setNewFeePercentage] = useState('');

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db!, 'users', userId), { status });
      toast({ title: `User ${status}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const getTierBasedFee = (tier: string | undefined): number => {
    // Default tier-based fees
    if (tier === 'Platinum') return 5;
    if (tier === 'Gold') return 7;
    if (tier === 'Silver') return 10;
    if (tier === 'Bronze') return 12;
    return 10; // Default
  };

  const getUserFee = (user: any): number => {
    // 1. Check if user has active promo
    if (user.promoEndDate) {
      const now = new Date();
      const promoEnd = user.promoEndDate.toDate ? user.promoEndDate.toDate() : new Date(user.promoEndDate);
      if (now < promoEnd) {
        return 0; // Active promo = 0% fee
      }
    }
    
    // 2. Custom fee takes precedence
    if (user.sellerFeePercentage !== undefined && user.sellerFeePercentage !== null) {
      return user.sellerFeePercentage;
    }
    
    // 3. Otherwise use tier-based
    return getTierBasedFee(user.sellerTier);
  };

  const getPromoStatus = (user: any): { active: boolean; daysLeft: number; code: string | null } => {
    if (!user.promoEndDate) return { active: false, daysLeft: 0, code: null };
    
    const now = new Date();
    const promoEnd = user.promoEndDate.toDate ? user.promoEndDate.toDate() : new Date(user.promoEndDate);
    const daysLeft = Math.ceil((promoEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      active: daysLeft > 0,
      daysLeft: Math.max(0, daysLeft),
      code: user.promoCode || null
    };
  };

  const handleGrantPromo = async (userId: string, username: string, days: number = 30) => {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db!, 'users', userId), {
        promoCode: 'FIRST100',
        promoStartDate: startDate,
        promoEndDate: endDate,
        sellerFeePercentage: 0
      });
      
      toast({ title: `Granted ${days}-day promo to @${username}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to grant promo" });
    }
  };

  // Count users with active FIRST100 promo
  const activePromoCount = useMemo(() => {
    if (!users) return 0;
    return users.filter(u => {
      const status = getPromoStatus(u);
      return status.active && status.code === 'FIRST100';
    }).length;
  }, [users]);

  const handleUpdateSellerFee = async () => {
    if (!selectedFeeUser || !newFeePercentage) {
      toast({ variant: 'destructive', title: "Missing fee percentage" });
      return;
    }
    
    const feeValue = parseFloat(newFeePercentage);
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      toast({ variant: 'destructive', title: "Fee must be between 0 and 100" });
      return;
    }

    try {
      await updateDoc(doc(db!, 'users', selectedFeeUser.uid), {
        sellerFeePercentage: feeValue
      });
      toast({ title: `Updated fee to ${feeValue}% for @${selectedFeeUser.username}` });
      setFeeDialogOpen(false);
      setSelectedFeeUser(null);
      setNewFeePercentage('');
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this community message?')) return;
    try {
      await deleteDoc(doc(db!, 'communityMessages', messageId));
      toast({ title: "Message Removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this ISO24 post?')) return;
    try {
      await deleteDoc(doc(db!, 'iso24Posts', postId));
      toast({ title: "Post Removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  const handleAssignSpotlight = async () => {
    if (!selectedSeller || !spotlightDays) {
      toast({ variant: 'destructive', title: "Missing Information" });
      return;
    }
    try {
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + parseInt(spotlightDays) * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db!, 'storeSpotlights', selectedSeller.uid), {
        ownerUid: selectedSeller.uid,
        storeName: selectedSeller.username,
        startAt,
        endAt,
        active: true,
        assignedBy: 'admin',
        assignedAt: new Date()
      });
      
      toast({ title: "Spotlight Assigned", description: `${selectedSeller.username} for ${spotlightDays} days` });
      setSpotlightDialogOpen(false);
      setSelectedSeller(null);
      setSpotlightDays('7');
    } catch (e) {
      toast({ variant: 'destructive', title: "Assignment Failed" });
    }
  };

  const handleAssignTheme = async () => {
    if (!selectedUser || !selectedTheme) {
      toast({ variant: 'destructive', title: "Missing Information" });
      return;
    }
    try {
      await updateDoc(doc(db!, 'users', selectedUser.uid), {
        storeTheme: selectedTheme
      });
      
      toast({ title: "Theme Assigned", description: `${selectedUser.username} now has ${selectedTheme} theme` });
      setThemeDialogOpen(false);
      setSelectedUser(null);
      setSelectedTheme('');
    } catch (e) {
      toast({ variant: 'destructive', title: "Assignment Failed" });
    }
  };

  const handleApproveWithdrawal = async (payoutId: string) => {
    if (!functions) {
      toast({ variant: 'destructive', title: "Cloud Functions unavailable" });
      return;
    }
    setApprovingId(payoutId);
    try {
      const approveWithdrawal = httpsCallable(functions, 'approveWithdrawal');
      await approveWithdrawal({ payoutRequestId: payoutId });
      toast({ title: "Withdrawal Approved", description: "Funds have been transferred to seller's Stripe account." });
    } catch (e: any) {
      toast({ 
        variant: 'destructive', 
        title: "Approval Failed", 
        description: e.message || "Failed to approve withdrawal"
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleDenyWithdrawal = async (payoutId: string) => {
    if (!functions) {
      toast({ variant: 'destructive', title: "Cloud Functions unavailable" });
      return;
    }
    const reason = prompt("Reason for denial (optional):");
    if (reason === null) return; // User cancelled
    
    setDenyingId(payoutId);
    try {
      const denyWithdrawal = httpsCallable(functions, 'denyWithdrawal');
      await denyWithdrawal({ payoutRequestId: payoutId, reason });
      toast({ title: "Withdrawal Denied", description: "Seller has been notified." });
    } catch (e: any) {
      toast({ 
        variant: 'destructive', 
        title: "Denial Failed", 
        description: e.message || "Failed to deny withdrawal"
      });
    } finally {
      setDenyingId(null);
    }
  };

  const totalGMV = useMemo(() => {
    return orders?.reduce((acc, order) => acc + (order.price || 0), 0) || 0;
  }, [orders]);

  return (
    <>
    <Tabs defaultValue="overview" className="space-y-10 animate-in fade-in duration-500">
      <TabsList className="bg-zinc-200/50 dark:bg-zinc-900 p-1 h-14 rounded-xl px-2 border overflow-x-auto justify-start md:justify-center flex-nowrap scrollbar-hide">
        <TabsTrigger value="overview" className="rounded-lg px-8 h-10 font-bold shrink-0">Overview</TabsTrigger>
        <TabsTrigger value="marketplace" className="rounded-lg px-8 h-10 font-bold shrink-0">Disputes</TabsTrigger>
        <TabsTrigger value="moderation" className="rounded-lg px-8 h-10 font-bold shrink-0">Moderation</TabsTrigger>
        <TabsTrigger value="messages" className="rounded-lg px-8 h-10 font-bold shrink-0">Chat</TabsTrigger>
        <TabsTrigger value="posts" className="rounded-lg px-8 h-10 font-bold shrink-0">Posts</TabsTrigger>
        <TabsTrigger value="spotlight" className="rounded-lg px-8 h-10 font-bold shrink-0">Spotlight</TabsTrigger>
        <TabsTrigger value="themes" className="rounded-lg px-8 h-10 font-bold shrink-0">Themes</TabsTrigger>
        <TabsTrigger value="reports" className="rounded-lg px-8 h-10 font-bold shrink-0">Reports</TabsTrigger>
        <TabsTrigger value="payouts" className="rounded-lg px-8 h-10 font-bold shrink-0">Payouts</TabsTrigger>
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
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Order ID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Value</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Parties</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {ordersLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : orders?.filter(o => o.status === 'Disputed' || o.status === 'Return Requested').length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground font-bold italic">No active disputes requiring intervention.</td></tr>
                ) : orders?.filter(o => o.status === 'Disputed' || o.status === 'Return Requested').map(order => (
                  <tr key={order.id} className="bg-amber-50/30 dark:bg-amber-900/20">
                    <td className="p-4"><code className="text-xs font-bold font-mono dark:text-zinc-200">#{order.id.substring(0, 8)}</code></td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500 text-amber-600 bg-amber-50">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-bold dark:text-zinc-200">${order.price?.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                        B: @{order.buyerName || '...'} <br/>
                        S: @{order.sellerName || '...'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button asChild className="bg-zinc-950 dark:bg-accent text-white dark:text-zinc-900 rounded-lg h-8 px-4 font-black text-[10px] uppercase">
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
                  <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                    <tr>
                      <th className="p-4 uppercase font-black tracking-widest dark:text-zinc-200">Item</th>
                      <th className="p-4 uppercase font-black tracking-widest dark:text-zinc-200">Seller</th>
                      <th className="p-4 uppercase font-black tracking-widest dark:text-zinc-200">Price</th>
                      <th className="p-4 text-right uppercase font-black tracking-widest dark:text-zinc-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                    {listingsLoading ? (
                      <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                    ) : listings?.map(l => (
                      <tr key={l.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <td className="p-4 font-bold dark:text-zinc-200">{l.title}</td>
                        <td className="p-4 text-zinc-500 dark:text-zinc-400 font-medium">@{l.sellerName}</td>
                        <td className="p-4 font-black dark:text-zinc-200">${l.price?.toLocaleString()}</td>
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
                  <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                    <tr>
                      <th className="p-4 uppercase font-black tracking-widest dark:text-zinc-200">Prize</th>
                      <th className="p-4 uppercase font-black tracking-widest dark:text-zinc-200">Seller</th>
                      <th className="p-4 uppercase font-black tracking-widest dark:text-zinc-200">Entries</th>
                      <th className="p-4 text-right uppercase font-black tracking-widest dark:text-zinc-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                    {giveaways?.map(g => (
                      <tr key={g.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <td className="p-4 font-bold dark:text-zinc-200">{g.title}</td>
                        <td className="p-4 text-zinc-500 dark:text-zinc-400 font-medium">@{g.sellerName}</td>
                        <td className="p-4 font-black dark:text-zinc-200">{g.entriesCount || 0}</td>
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

      <TabsContent value="messages">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">User</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Message</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Time</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {messagesLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : !communityMessages || communityMessages.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-bold italic">No community messages to review.</td></tr>
                ) : communityMessages.map(msg => (
                  <tr key={msg.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="p-4 font-bold dark:text-zinc-200">@{msg.userName || 'Unknown'}</td>
                    <td className="p-4 text-sm dark:text-zinc-300 truncate max-w-xs">{msg.content}</td>
                    <td className="p-4 text-[10px] text-zinc-500 dark:text-zinc-400">{msg.createdAt?.toDate?.().toLocaleDateString?.() || '-'}</td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="posts">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Type</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Author</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Content</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {postsLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : !iso24Posts || iso24Posts.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-bold italic">No ISO24 posts to review.</td></tr>
                ) : iso24Posts.map(post => (
                  <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="p-4 text-[10px] font-black uppercase dark:text-zinc-200">ISO24</td>
                    <td className="p-4 font-bold dark:text-zinc-200">@{post.userName || 'Unknown'}</td>
                    <td className="p-4 text-sm dark:text-zinc-300 truncate max-w-xs">{post.title || post.content}</td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="spotlight">
        <div className="grid gap-6">
          <Card className="rounded-2xl border-none shadow-sm p-6">
            <h3 className="font-black text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" /> Assign Store Spotlight
            </h3>
            <Button 
              onClick={() => setSpotlightDialogOpen(true)}
              className="bg-accent text-white font-black rounded-xl h-12 px-6"
            >
              <Crown className="w-4 h-4 mr-2" /> Assign Spotlight
            </Button>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Store</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Active</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Until</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-700">
                  {spotlightsLoading ? (
                    <tr><td colSpan={3} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                  ) : !spotlights || spotlights.length === 0 ? (
                    <tr><td colSpan={3} className="p-12 text-center text-muted-foreground font-bold italic">No active spotlights.</td></tr>
                  ) : spotlights.map(spot => (
                    <tr key={spot.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="p-4 font-bold dark:text-zinc-200">{spot.storeName}</td>
                      <td className="p-4"><Badge className={spot.active ? "bg-green-600" : "bg-gray-600"}>{spot.active ? "Active" : "Inactive"}</Badge></td>
                      <td className="p-4 text-sm dark:text-zinc-300">{spot.endAt?.toDate?.().toLocaleDateString?.() || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="themes">
        <div className="grid gap-6">
          <Card className="rounded-2xl border-none shadow-sm p-6">
            <h3 className="font-black text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-500" /> Assign Store Themes
            </h3>
            <Button 
              onClick={() => setThemeDialogOpen(true)}
              className="bg-primary text-white font-black rounded-xl h-12 px-6"
            >
              <Palette className="w-4 h-4 mr-2" /> Assign Theme
            </Button>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">User</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Theme</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-700">
                  {usersLoading ? (
                    <tr><td colSpan={2} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                  ) : !users ? (
                    <tr><td colSpan={2} className="p-12 text-center text-muted-foreground font-bold italic">Loading users...</td></tr>
                  ) : users.filter(u => u.storeTheme).map(user => (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="p-4 font-bold dark:text-zinc-200">@{user.username}</td>
                      <td className="p-4 text-sm"><Badge>{user.storeTheme}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
                  <h4 className="font-black text-lg dark:text-zinc-200">@{r.reportedName}</h4>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{r.reason}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">"{r.details}"</p>
                  <div className="pt-2 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                    Reported by: @{r.reporterName} • {r.timestamp?.toDate ? new Date(r.timestamp.toDate()).toLocaleString() : 'Just now'}
                  </div>
                </div>
                <Button onClick={() => handleResolveReport(r.id)} className="bg-zinc-950 dark:bg-accent text-white dark:text-zinc-900 rounded-xl h-10 px-6 font-black text-[10px] uppercase">Mark Resolved</Button>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="users">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg uppercase tracking-tight">User Management</h3>
              <Badge variant="secondary" className="font-black uppercase text-[9px] tracking-widest">
                {activePromoCount} / 100 FIRST100 Promos Active
              </Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">User</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Role</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Fee %</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {usersLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : users?.map(u => {
                  const fee = getUserFee(u);
                  const promoStatus = getPromoStatus(u);
                  return (
                    <tr key={u.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-black text-xs dark:text-zinc-200">{u.username?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="font-bold text-sm dark:text-zinc-200">@{u.username}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">{u.email}</p>
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
                      <td className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">{u.role}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-black text-lg",
                              promoStatus.active ? "text-green-600" : "dark:text-zinc-200"
                            )}>
                              {fee}%
                            </span>
                            {promoStatus.active && (
                              <Badge className="bg-green-600 text-[8px] font-black">
                                PROMO {promoStatus.daysLeft}d left
                              </Badge>
                            )}
                          </div>
                          {u.sellerFeePercentage !== undefined && u.sellerFeePercentage !== null && !promoStatus.active && (
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">Custom Fee</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 font-black text-[9px] uppercase" 
                            onClick={() => {
                              setSelectedFeeUser({
                                uid: u.id,
                                username: u.username,
                                currentFee: u.sellerFeePercentage ?? null,
                                tier: u.sellerTier || 'Bronze'
                              });
                              setNewFeePercentage((u.sellerFeePercentage ?? getTierBasedFee(u.sellerTier)).toString());
                              setFeeDialogOpen(true);
                            }}
                          >
                            <Wallet className="w-3 h-3 mr-1" /> Edit Fee
                          </Button>
                          {!promoStatus.active && activePromoCount < 100 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 font-black text-[9px] uppercase text-green-600 hover:bg-green-50" 
                              onClick={() => handleGrantPromo(u.id, u.username, 30)}
                            >
                              <Crown className="w-3 h-3 mr-1" /> Grant Promo
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 font-black text-[10px] uppercase text-red-600 hover:bg-red-50" 
                            onClick={() => handleUpdateUserStatus(u.id, u.status === 'BANNED' ? 'ACTIVE' : 'BANNED')}
                          >
                            {u.status === 'BANNED' ? <UserCheck className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                            {u.status === 'BANNED' ? 'Unban' : 'Ban'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="payouts">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Seller</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Amount</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Requested</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Status</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest dark:text-zinc-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {payoutRequestsLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></td></tr>
                ) : payoutRequests?.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground font-bold italic">No pending withdrawal requests.</td></tr>
                ) : payoutRequests?.map(payout => (
                  <tr key={payout.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-black text-[10px] dark:text-zinc-200">{payout.sellerUsername?.[0]?.toUpperCase()}</div>
                        <div>
                          <p className="font-bold text-sm dark:text-zinc-200">@{payout.sellerUsername}</p>
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">{payout.sellerUid?.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-black text-lg dark:text-zinc-200">${payout.amount?.toLocaleString()}</td>
                    <td className="p-4 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {payout.createdAt?.toDate ? new Date(payout.createdAt.toDate()).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      <Badge className="text-[9px] font-black uppercase bg-yellow-600">
                        {payout.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-green-600 text-white hover:bg-green-700 font-black text-[10px]"
                          onClick={() => handleApproveWithdrawal(payout.id)}
                          disabled={approvingId === payout.id || denyingId === payout.id}
                        >
                          {approvingId === payout.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-600 hover:bg-red-50 font-black text-[10px]"
                          onClick={() => handleDenyWithdrawal(payout.id)}
                          disabled={approvingId === payout.id || denyingId === payout.id}
                        >
                          {denyingId === payout.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                          Deny
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>
    </Tabs>

    <Dialog open={spotlightDialogOpen} onOpenChange={setSpotlightDialogOpen}>
      <DialogContent className="sm:max-w-[400px] dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Assign Store Spotlight</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select Seller</Label>
            <select 
              aria-label="Select seller for spotlight"
              value={selectedSeller?.uid || ''}
              onChange={(e) => {
                const seller = users?.find(u => u.id === e.target.value);
                if (seller) setSelectedSeller({ uid: seller.id, username: seller.username });
              }}
              className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
            >
              <option value="">Choose a seller...</option>
              {users?.filter(u => u.isSeller).map(u => (
                <option key={u.id} value={u.id}>@{u.username}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Duration (days)</Label>
            <Input 
              type="number" 
              value={spotlightDays}
              onChange={(e) => setSpotlightDays(e.target.value)}
              min="1"
              max="90"
              className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setSpotlightDialogOpen(false)} className="flex-1 dark:border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleAssignSpotlight} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black">
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
      <DialogContent className="sm:max-w-[400px] dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Assign Store Theme</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select User</Label>
            <select 
              aria-label="Select user for theme assignment"
              value={selectedUser?.uid || ''}
              onChange={(e) => {
                const user = users?.find(u => u.id === e.target.value);
                if (user) setSelectedUser({ uid: user.id, username: user.username });
              }}
              className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
            >
              <option value="">Choose a user...</option>
              {users?.map(u => (
                <option key={u.id} value={u.id}>@{u.username}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <select 
              aria-label="Select store theme"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
            >
              <option value="">Choose a theme...</option>
              <option value="default">Default</option>
              <option value="comic-book">Comic Book</option>
              <option value="neon-syndicate">Neon Syndicate</option>
              <option value="urban">Urban</option>
              <option value="hobby-shop">Hobby Shop</option>
            </select>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setThemeDialogOpen(false)} className="flex-1 dark:border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleAssignTheme} className="flex-1 bg-primary hover:bg-primary/90 text-white font-black">
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
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
