
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
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type ListingDoc = {
  id?: string;
  title?: string;
  ownerUid?: string;
  storeId?: string;
  price?: number;
  state?: string;
};

type IsoPostDoc = {
  id?: string;
  title?: string;
  ownerUid?: string;
  status?: string;
};

type ChatDoc = {
  id?: string;
  authorUid?: string;
  authorDisplayName?: string;
  text?: string;
};

export default function AdminModerationPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const role = profile?.role;
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR';
  const isStaff = isAdmin || isModerator;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Kick non-staff out (extra guard; AdminLayout already handles this)
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isStaff) {
      router.replace('/');
    }
  }, [authLoading, user, isStaff, router]);

  // Listings
  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );
  }, [firestore]);

  const {
    data: listings,
    isLoading: listingsLoading,
  } = useCollection<ListingDoc>(listingsQuery);

  // ISO24 posts
  const isoQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'iso24Posts'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );
  }, [firestore]);

  const {
    data: isoPosts,
    isLoading: isoLoading,
  } = useCollection<IsoPostDoc>(isoQuery);

  // Community chat messages
  const chatQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'communityMessages'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
  }, [firestore]);

  const {
    data: chats,
    isLoading: chatsLoading,
  } = useCollection<ChatDoc>(chatQuery);

  // -------- content delete helpers --------

  const handleDeleteDoc = async (path: string, id: string) => {
    if (!firestore) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(firestore, path, id));
    } finally {
      setDeletingId(null);
    }
  };

  // -------- user status helpers (ADMIN ONLY) --------

  const updateUserStatus = async (
    targetUid: string | undefined,
    status: 'ACTIVE' | 'LIMITED' | 'BANNED',
  ) => {
    if (!firestore || !targetUid || !isAdmin) return;
    setUpdatingUserId(targetUid);
    try {
      const userRef = doc(firestore, 'users', targetUid);
      await updateDoc(userRef, { status });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const suspendUser = (uid?: string) =>
    updateUserStatus(uid, 'LIMITED');

  const banUser = (uid?: string) =>
    updateUserStatus(uid, 'BANNED');

  if (authLoading || !user || !isStaff) {
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
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Listings moderation */}
        <Card>
          <CardHeader>
            <CardTitle>Listings moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {listingsLoading && (
              <div className="text-sm text-muted-foreground">
                Loading listings…
              </div>
            )}
            {!listingsLoading && (!listings || listings.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No recent listings found.
              </div>
            )}
            {!listingsLoading && listings && listings.length > 0 && (
              <div className="space-y-2">
                {listings.map((l) => {
                  const id = l.id as string;
                  const ownerUid = l.ownerUid;
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-3 border rounded-md px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {l.title || 'Untitled listing'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          store: {l.storeId || 'n/a'} • owner:{' '}
                          {ownerUid || 'unknown'}
                        </div>
                        {typeof l.price === 'number' && (
                          <div className="text-[11px] text-muted-foreground">
                            ${l.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{l.state || 'ACTIVE'}</Badge>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={deletingId === id}
                            onClick={() =>
                              handleDeleteDoc('listings', id)
                            }
                          >
                            Delete listing
                          </Button>

                          {isAdmin && ownerUid && (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingUserId === ownerUid}
                                onClick={() => suspendUser(ownerUid)}
                              >
                                Suspend owner
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={updatingUserId === ownerUid}
                                onClick={() => banUser(ownerUid)}
                              >
                                Ban owner
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ISO24 moderation */}
        <Card>
          <CardHeader>
            <CardTitle>ISO24 moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isoLoading && (
              <div className="text-sm text-muted-foreground">
                Loading ISO24 posts…
              </div>
            )}
            {!isoLoading && (!isoPosts || isoPosts.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No recent ISO24 posts found.
              </div>
            )}
            {!isoLoading && isoPosts && isoPosts.length > 0 && (
              <div className="space-y-2">
                {isoPosts.map((p) => {
                  const id = p.id as string;
                  const ownerUid = p.ownerUid;
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-3 border rounded-md px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {p.title || 'Untitled ISO'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          owner: {ownerUid || 'unknown'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">
                          {p.status || 'OPEN'}
                        </Badge>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={deletingId === id}
                            onClick={() =>
                              handleDeleteDoc('iso24Posts', id)
                            }
                          >
                            Delete ISO
                          </Button>

                          {isAdmin && ownerUid && (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingUserId === ownerUid}
                                onClick={() => suspendUser(ownerUid)}
                              >
                                Suspend owner
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={updatingUserId === ownerUid}
                                onClick={() => banUser(ownerUid)}
                              >
                                Ban owner
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community chat moderation */}
        <Card>
          <CardHeader>
            <CardTitle>Community chat moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {chatsLoading && (
              <div className="text-sm text-muted-foreground">
                Loading messages…
              </div>
            )}
            {!chatsLoading && (!chats || chats.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No recent messages found.
              </div>
            )}
            {!chatsLoading && chats && chats.length > 0 && (
              <div className="space-y-2">
                {chats.map((m) => {
                  const id = m.id as string;
                  const authorUid = m.authorUid;
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-3 border rounded-md px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {m.authorDisplayName ||
                            m.authorUid ||
                            'Unknown'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {m.text}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={deletingId === id}
                            onClick={() =>
                              handleDeleteDoc(
                                'communityMessages',
                                id,
                              )
                            }
                          >
                            Delete message
                          </Button>

                          {isAdmin && authorUid && (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={updatingUserId === authorUid}
                                onClick={() => suspendUser(authorUid)}
                              >
                                Suspend author
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={updatingUserId === authorUid}
                                onClick={() => banUser(authorUid)}
                              >
                                Ban author
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
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
