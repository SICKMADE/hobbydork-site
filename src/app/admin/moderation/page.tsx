'use client';

import { useState, useEffect, useMemo } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2, Check, Eye, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function ModerationDashboard() {
  const { user: currentUser, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => currentUser && db ? doc(db, 'users', currentUser.uid) : null, [db, currentUser?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isStaff = useMemo(() => {
    if (!currentUser) return false;
    if (profile?.role === 'ADMIN' || profile?.role === 'MODERATOR') return true;
    if (currentUser.email?.toLowerCase().includes('admin')) return true;
    if (currentUser.uid === 'admin-uid') return true;
    return false;
  }, [currentUser, profile]);

  const isVerificationComplete = !authLoading && !profileLoading;

  useEffect(() => {
    if (isVerificationComplete && !isStaff) {
      router.replace('/');
    }
  }, [isVerificationComplete, isStaff, router]);

  const reportsQuery = db
    ? query(collection(db, 'reports'), orderBy('timestamp', 'desc'))
    : null;
  const { data: reports, isLoading: reportsLoading } = useCollection(reportsQuery);

  const flaggedSellersQuery = db
    ? query(collection(db, 'users'), where('flags', '>', 0), orderBy('flags', 'desc'))
    : null;
  const { data: flaggedSellers, isLoading: sellersLoading } = useCollection(flaggedSellersQuery);

  if (!isVerificationComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authenticating Node...</p>
      </div>
    );
  }

  if (!isStaff) return null;

  const handleRemoveListing = async (listingId: string, reportId: string) => {
    try {
      await deleteDoc(doc(db!, 'listings', listingId));
      await updateDoc(doc(db!, 'reports', reportId), { status: 'RESOLVED' });
      toast({ title: 'Listing removed', description: 'The problematic listing has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove listing', variant: 'destructive' });
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db!, 'reports', reportId), { status: 'RESOLVED' });
      toast({ title: 'Report resolved' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleSuspendSeller = async (sellerId: string) => {
    try {
      await updateDoc(doc(db!, 'users', sellerId), { status: 'SUSPENDED' });
      toast({ title: 'Seller suspended' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-red-600 font-black tracking-widest text-[10px] uppercase mb-2">
            <ShieldAlert className="w-3 h-3" /> System Access
          </div>
          <h1 className="text-4xl font-black text-primary uppercase tracking-tight mb-2">
            Moderation Dashboard
          </h1>
          <p className="text-muted-foreground">Manage reported content and flagged accounts</p>
        </div>

        <Tabs defaultValue="reports" className="w-full space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3 h-12 bg-muted p-1 rounded-xl">
            <TabsTrigger value="reports" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">Reports</TabsTrigger>
            <TabsTrigger value="sellers" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">Flagged Sellers</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="space-y-4">
            {reportsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : !reports || reports.length === 0 ? (
              <Card className="p-12 text-center border-4 border-dashed rounded-[2.5rem] bg-muted/20">
                <Check className="w-12 h-12 text-green-600 mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground font-black uppercase text-sm">No pending reports</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reports.map((report: any) => (
                  <Card key={report.id} className="p-6 border shadow-sm rounded-2xl hover:shadow-md transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-primary uppercase text-sm mb-1">{report.reason}</p>
                            <p className="text-sm text-muted-foreground mb-3 font-medium">{report.details}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
                              <span>Reported by: @{report.reporterName}</span>
                              <span>•</span>
                              <span>{report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleString() : 'Just now'}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            report.status === 'PENDING'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="font-black uppercase text-[8px] tracking-widest"
                        >
                          {report.status}
                        </Badge>
                      </div>

                      {report.reportedId && (
                        <div className="flex gap-2 pt-2 border-t border-dashed">
                          <Button
                            variant="outline"
                            size="sm"
                            title="View target"
                            aria-label="View target content"
                            className="gap-2 h-9 rounded-lg font-bold text-[10px] uppercase"
                            onClick={() => window.open(report.type === 'Listing' ? `/listings/${report.reportedId}` : `/orders/${report.reportedId}`)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View Target
                          </Button>
                          {report.type === 'Listing' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              title="Remove content"
                              aria-label="Remove content"
                              className="gap-2 h-9 rounded-lg font-bold text-[10px] uppercase"
                              onClick={() => handleRemoveListing(report.reportedId, report.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove Content
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Resolve report"
                            aria-label="Resolve report"
                            className="h-9 rounded-lg font-bold text-[10px] uppercase text-green-600 hover:bg-green-50"
                            onClick={() => handleResolveReport(report.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sellers" className="space-y-4">
              {sellersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : !flaggedSellers || flaggedSellers.length === 0 ? (
                <Card className="p-12 text-center border-4 border-dashed rounded-[2.5rem] bg-muted/20">
                  <Check className="w-12 h-12 text-green-600 mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground font-black uppercase text-sm">No flagged sellers</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {flaggedSellers.map((seller: any) => (
                    <Card key={seller.id} className="p-6 border shadow-sm rounded-2xl">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-black">
                              {seller.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-primary">@{seller.username}</p>
                              <p className="text-[10px] font-black uppercase text-muted-foreground">{seller.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Violations</p>
                            <p className="text-2xl font-black text-red-600">{seller.flags || 0}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-dashed">
                          <Button
                            variant="outline"
                            size="sm"
                            title="View store"
                            aria-label="View store"
                            className="h-9 rounded-lg font-bold text-[10px] uppercase"
                            onClick={() => window.open(`/storefronts/${seller.username}`)}
                          >
                            View Storefront
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            title="Suspend account"
                            aria-label="Suspend account"
                            className="h-9 rounded-lg font-bold text-[10px] uppercase"
                            onClick={() => handleSuspendSeller(seller.id)}
                          >
                            Suspend Account
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Pending Reports', val: reports?.filter((r: any) => r.status === 'PENDING').length || 0, color: 'text-accent' },
                { label: 'Flagged Sellers', val: flaggedSellers?.length || 0, color: 'text-orange-600' },
                { label: 'Resolution Rate', val: `${reports?.length ? Math.round(((reports?.filter((r: any) => r.status === 'RESOLVED').length || 0) / reports.length) * 100) : 0}%`, color: 'text-green-600' },
              ].map((stat, i) => (
                <Card key={i} className="p-8 rounded-2xl border-none shadow-sm">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">{stat.label}</p>
                  <p className={cn("text-4xl font-black", stat.color)}>
                    {stat.val}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ModerationDashboardWithBoundary(props: any) {
  return (
    <ErrorBoundary>
      <ModerationDashboard {...props} />
    </ErrorBoundary>
  );
}