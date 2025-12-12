
'use client';

import React from 'react';
import Image from 'next/image';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  doc,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type SellerApplication = {
  applicationId: string;
  ownerUid: string;
  ownerEmail?: string | null;
  ownerDisplayName?: string | null;
  inventoryImageUrl: string;
  notes?: string | null;
  social?: {
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    website?: string | null;
    other?: string | null;
  };
  sellerAgreementAccepted?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: any;
  updatedAt?: any;
};

function statusBadge(status: SellerApplication['status']) {
  switch (status) {
    case 'PENDING':
      return <Badge className="text-[10px]">Pending</Badge>;
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-[10px]">
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className="text-[10px]">
          Rejected
        </Badge>
      );
    default:
      return null;
  }
}

export default function AdminSellerApplicationsPage() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'ADMIN';

  const appsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sellerApplications'),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore]);

  const {
    data: apps,
    isLoading,
  } = useCollection<SellerApplication>(appsQuery as any);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Not authorized</CardTitle>
              <CardDescription>
                You must be an admin to view seller applications.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleApprove = async (app: SellerApplication) => {
    if (!firestore || !user) return;

    try {
      const appRef = doc(
        firestore,
        'sellerApplications',
        app.applicationId,
      );
      const userRef = doc(firestore, 'users', app.ownerUid);

      await runTransaction(firestore, async (tx) => {
        const appSnap = await tx.get(appRef);
        if (!appSnap.exists()) {
          throw new Error('Application no longer exists.');
        }
        const current = appSnap.data() as SellerApplication;
        if (current.status !== 'PENDING') {
          throw new Error('Application is not pending.');
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('User not found.');
        }

        tx.update(appRef, {
          status: 'APPROVED',
          updatedAt: serverTimestamp(),
          reviewedAt: serverTimestamp(),
          reviewedByUid: user.uid,
        });

        // Mark user as APPROVED seller (they still go through store setup)
        tx.update(userRef, {
          sellerStatus: 'APPROVED',
          updatedAt: serverTimestamp(),
        });
      });

      toast({
        title: 'Seller approved',
        description:
          'The user can now create their store and start listing items.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error approving seller',
        description: err?.message ?? 'Could not approve application.',
      });
    }
  };

  const handleReject = async (app: SellerApplication) => {
    if (!firestore || !user) return;

    try {
      const appRef = doc(
        firestore,
        'sellerApplications',
        app.applicationId,
      );
      const userRef = doc(firestore, 'users', app.ownerUid);

      await runTransaction(firestore, async (tx) => {
        const appSnap = await tx.get(appRef);
        if (!appSnap.exists()) {
          throw new Error('Application no longer exists.');
        }
        const current = appSnap.data() as SellerApplication;
        if (current.status !== 'PENDING') {
          throw new Error('Application is not pending.');
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('User not found.');
        }

        tx.update(appRef, {
          status: 'REJECTED',
          updatedAt: serverTimestamp(),
          reviewedAt: serverTimestamp(),
          reviewedByUid: user.uid,
        });

        tx.update(userRef, {
          sellerStatus: 'REJECTED',
          updatedAt: serverTimestamp(),
        });
      });

      toast({
        title: 'Seller rejected',
        description:
          'The application has been rejected. You can always manually revisit it later.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error rejecting seller',
        description: err?.message ?? 'Could not reject application.',
      });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Seller applications</CardTitle>
            <CardDescription>
              Review seller applications, check social links, and approve or reject.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {!isLoading && (!apps || apps.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No seller applications yet.
              </p>
            )}

            {!isLoading && apps && apps.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Notes / Social</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.applicationId}>
                      <TableCell className="align-top text-xs">
                        <div className="font-medium">
                          {app.ownerDisplayName || 'Unknown user'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {app.ownerEmail || 'No email'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          UID: {app.ownerUid}
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="relative h-20 w-32 overflow-hidden rounded-md border bg-muted">
                          <Image
                            src={app.inventoryImageUrl}
                            alt="Inventory proof"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="align-top text-xs">
                        {app.notes && (
                          <p className="mb-2 whitespace-pre-wrap text-xs">
                            {app.notes}
                          </p>
                        )}
                        {app.social && (
                          <div className="space-y-0.5 text-[11px] text-muted-foreground">
                            {app.social.instagram && (
                              <p>IG: {app.social.instagram}</p>
                            )}
                            {app.social.facebook && (
                              <p>FB: {app.social.facebook}</p>
                            )}
                            {app.social.twitter && (
                              <p>TW: {app.social.twitter}</p>
                            )}
                            {app.social.tiktok && (
                              <p>TT: {app.social.tiktok}</p>
                            )}
                            {app.social.website && (
                              <p>Site: {app.social.website}</p>
                            )}
                            {app.social.other && (
                              <p>Other: {app.social.other}</p>
                            )}
                          </div>
                        )}
                        {app.sellerAgreementAccepted === false && (
                          <p className="mt-1 text-[11px] text-red-500">
                            Did not accept seller agreement
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="align-top">
                        {statusBadge(app.status)}
                      </TableCell>

                      <TableCell className="align-top text-right">
                        {app.status === 'PENDING' ? (
                          <div className="flex flex-col items-end gap-1">
                            <Button
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => handleApprove(app)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => handleReject(app)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            No actions
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
