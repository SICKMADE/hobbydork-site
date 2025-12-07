'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';

import {
  collection,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type ReportDoc = {
  id?: string;
  reporterUid?: string;
  reporterDisplayName?: string;
  targetType?: string; // 'USER' | 'LISTING' | 'ISO24' | 'MESSAGE' | etc
  targetId?: string;
  targetUserUid?: string;
  targetListingId?: string;
  targetIsoId?: string;
  targetMessageId?: string;
  reason?: string;
  details?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED' | string;
  createdAt?: any;
  handledAt?: any;
  handledByUid?: string;
  resolutionNotes?: string;
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const isAdmin = profile?.role === 'ADMIN';

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Only admins can see this page
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.replace('/');
    }
  }, [authLoading, user, isAdmin, router]);

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
  }, [firestore]);

  const {
    data: reports,
    isLoading: reportsLoading,
  } = useCollection<ReportDoc>(reportsQuery);

  const updateReportStatus = async (
    reportId: string,
    patch: Partial<ReportDoc>,
  ) => {
    if (!firestore || !isAdmin) return;
    setUpdatingId(reportId);
    try {
      const ref = doc(firestore, 'reports', reportId);
      await updateDoc(ref, patch as any);
    } finally {
      setUpdatingId(null);
    }
  };

  const markOpen = (r: ReportDoc) =>
    updateReportStatus(r.id as string, { status: 'OPEN' });

  const markInProgress = (r: ReportDoc) =>
    updateReportStatus(r.id as string, { status: 'IN_PROGRESS' });

  const markResolved = (r: ReportDoc) =>
    updateReportStatus(r.id as string, { status: 'RESOLVED' });

  const markDismissed = (r: ReportDoc) =>
    updateReportStatus(r.id as string, { status: 'DISMISSED' });

  if (authLoading || !user || !isAdmin) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">User reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportsLoading && (
              <div className="text-sm text-muted-foreground">
                Loading reports…
              </div>
            )}

            {!reportsLoading && (!reports || reports.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No reports found.
              </div>
            )}

            {!reportsLoading && reports && reports.length > 0 && (
              <div className="space-y-2">
                {reports.map((r) => {
                  const id = r.id as string;
                  const status = (r.status || 'OPEN') as
                    | 'OPEN'
                    | 'IN_PROGRESS'
                    | 'RESOLVED'
                    | 'DISMISSED';

                  const targetLabel =
                    r.targetType && (r.targetId || r.targetUserUid
                      || r.targetListingId || r.targetIsoId
                      || r.targetMessageId)
                      ? `${r.targetType} – ${
                          r.targetId ||
                          r.targetUserUid ||
                          r.targetListingId ||
                          r.targetIsoId ||
                          r.targetMessageId
                        }`
                      : r.targetType || 'Unknown target';

                  return (
                    <div
                      key={id}
                      className="border rounded-md px-3 py-2 text-sm flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {r.reason || 'Reported activity'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Reporter:{' '}
                            {r.reporterDisplayName || r.reporterUid || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Target: {targetLabel}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className="text-xs px-2 py-0.5"
                            variant={
                              status === 'OPEN'
                                ? 'destructive'
                                : status === 'IN_PROGRESS'
                                ? 'default'
                                : status === 'RESOLVED'
                                ? 'outline'
                                : 'outline'
                            }
                          >
                            {status}
                          </Badge>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {status !== 'OPEN' && (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingId === id}
                                onClick={() => markOpen(r)}
                              >
                                Reopen
                              </Button>
                            )}
                            {status !== 'IN_PROGRESS' && (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingId === id}
                                onClick={() => markInProgress(r)}
                              >
                                In progress
                              </Button>
                            )}
                            {status !== 'RESOLVED' && (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingId === id}
                                onClick={() => markResolved(r)}
                              >
                                Resolve
                              </Button>
                            )}
                            {status !== 'DISMISSED' && (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingId === id}
                                onClick={() => markDismissed(r)}
                              >
                                Dismiss
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {r.details && (
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {r.details}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
