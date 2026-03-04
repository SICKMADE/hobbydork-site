'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldAlert, Trash2, Check, X, Eye, AlertTriangle, Flag } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function ModerationDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // Delete AI feedback
  const handleDeleteAiFeedback = async (feedbackId: string) => {
    try {
      await deleteDoc(doc(db!, 'aiFeedback', feedbackId));
      toast({ title: 'Feedback deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete feedback', variant: 'destructive' });
    }
  };
  // Fetch AI grading feedback
  const aiFeedbackQuery = db
    ? query(collection(db, 'aiFeedback'), orderBy('createdAt', 'desc'))
    : null;
  const { data: aiFeedback, isLoading: aiFeedbackLoading } = useCollection(aiFeedbackQuery);

  // Check if user is admin
  useEffect(() => {
    if (user?.email?.includes('admin') || user?.uid === 'admin-uid') {
      setIsAdmin(true);
    } else {
      router.push('/');
    }
  }, [user, router]);

  // Fetch reported listings
  const reportsQuery = db
    ? query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    : null;
  const { data: reports, isLoading: reportsLoading } = useCollection(reportsQuery);

  // Fetch flagged sellers
  const flaggedSellersQuery = db
    ? query(collection(db, 'users'), where('flags', '>', 0), orderBy('flags', 'desc'))
    : null;
  const { data: flaggedSellers, isLoading: sellersLoading } = useCollection(flaggedSellersQuery);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleRemoveListing = async (listingId: string, reportId: string) => {
    try {
      await deleteDoc(doc(db!, 'listings', listingId));
      await updateDoc(doc(db!, 'reports', reportId), { status: 'resolved' });
      toast({ title: 'Listing removed', description: 'The problematic listing has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove listing', variant: 'destructive' });
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db!, 'reports', reportId), { status: 'resolved' });
      toast({ title: 'Report resolved' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleSuspendSeller = async (sellerId: string) => {
    try {
      await updateDoc(doc(db!, 'users', sellerId), { suspended: true });
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
          <h1 className="text-4xl font-black text-primary uppercase tracking-tight mb-2">
            Moderation Dashboard
          </h1>
          <p className="text-muted-foreground">Manage reported content and flagged accounts</p>
        </div>

        <Tabs defaultValue="reports" className="w-full space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="sellers">Flagged Sellers</TabsTrigger>
            <TabsTrigger value="ai-feedback">AI Grading Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        <TabsContent value="ai-feedback" className="space-y-4">
          {aiFeedbackLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : !aiFeedback || aiFeedback.length === 0 ? (
            <Card className="p-8 text-center bg-green-50 border-green-200">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="text-green-900 font-bold">No AI grading feedback</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(aiFeedback || []).map((fb: any) => (
                <Card key={fb.id} className="p-6 border-blue-200 bg-blue-50/50">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-blue-900 mb-1">{fb.feedback}</p>
                        <p className="text-xs text-blue-700 mb-1">From: <span className="font-bold">{fb.username}</span></p>
                        <p className="text-xs text-blue-700 mb-1">Listing: <span className="font-bold">{fb.listingId}</span></p>
                        {fb.aiType && <p className="text-xs text-blue-700">AI Type: <span className="font-bold">{fb.aiType}</span></p>}
                        {fb.aiCondition && typeof fb.aiCondition === 'object' && (
                          <div className="text-xs text-blue-700 mt-1">
                            <div>AI Condition: <span className="font-bold">{fb.aiCondition.overallCondition}</span></div>
                            <div>Confidence: {(fb.aiCondition.confidence * 100).toFixed(1)}%</div>
                          </div>
                        )}
                        <p className="text-xs text-blue-500 mt-2">{fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleString() : ''}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(`/listings/${fb.listingId}`)}
                        >
                          <Eye className="w-4 h-4" /> View Listing
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDeleteAiFeedback(fb.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {reportsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : !reports || reports.length === 0 ? (
              <Card className="p-8 text-center bg-green-50 border-green-200">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="text-green-900 font-bold">No pending reports</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {(reports || []).map((report: any) => (
                  <Card key={report.id} className="p-6 border-orange-200 bg-orange-50/50">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <AlertTriangle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-orange-900 mb-1">{report.reason}</p>
                            <p className="text-sm text-orange-800 mb-2">{report.details}</p>
                            <p className="text-xs text-orange-700">
                              Reported by: <span className="font-bold">{report.reporterName}</span>
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            report.status === 'pending'
                              ? 'destructive'
                              : report.status === 'under-review'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>

                      {report.listingId && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.open(`/listings/${report.listingId}`)}
                          >
                            <Eye className="w-4 h-4" /> View Listing
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleRemoveListing(report.listingId, report.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
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
              <Card className="p-8 text-center bg-green-50 border-green-200">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="text-green-900 font-bold">No flagged sellers</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {flaggedSellers.map((seller: any) => (
                  <Card key={seller.id} className="p-6 border-red-200 bg-red-50/50">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-red-900 mb-1">{seller.displayName}</p>
                          <p className="text-sm text-red-800">@{seller.displayName}</p>
                          <p className="text-xs text-red-700 mt-2">
                            Flags: <span className="font-black">{seller.flags}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-900">Violations</p>
                          <p className="text-lg font-black text-red-600">{seller.flags}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/shop/${seller.displayName}`)}
                        >
                          View Shop
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-sm font-bold text-muted-foreground mb-2">Pending Reports</p>
                <p className="text-3xl font-black text-accent">
                  {(reports || []).filter((r: any) => r.status === 'pending').length || 0}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-sm font-bold text-muted-foreground mb-2">Flagged Sellers</p>
                <p className="text-3xl font-black text-orange-600">
                  {flaggedSellers?.length || 0}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-sm font-bold text-muted-foreground mb-2">Resolution Rate</p>
                <p className="text-3xl font-black text-green-600">
                  {reports?.length ? Math.round(((reports?.filter((r: any) => r.status === 'resolved').length || 0) / reports.length) * 100) : 0}%
                </p>
              </Card>
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
