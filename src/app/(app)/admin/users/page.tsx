'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type UserDoc = {
  id?: string;
  uid?: string;
  email?: string;
  displayName?: string;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  status?: 'ACTIVE' | 'LIMITED' | 'BANNED' | string;
  isSeller?: boolean;
  storeId?: string;
  createdAt?: any;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'ADMIN';

  // Only admins can see this page at all
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.replace('/');
    }
  }, [authLoading, user, isAdmin, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const {
    data: users,
    isLoading: usersLoading,
  } = useCollection<UserDoc>(usersQuery);

  const handleUpdateUser = async (targetId: string, patch: Partial<UserDoc>) => {
    if (!firestore) return;
    setUpdatingUserId(targetId);
    try {
      const ref = doc(firestore, 'users', targetId);
      await updateDoc(ref, patch as any);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ---- STATUS CONTROLS ----

  const setStatus = (u: UserDoc, status: 'ACTIVE' | 'LIMITED' | 'BANNED') =>
    handleUpdateUser(u.id || (u.uid as string), { status });

  const handleSuspend = (u: UserDoc) => setStatus(u, 'LIMITED');
  const handleUnsuspend = (u: UserDoc) => setStatus(u, 'ACTIVE');
  const handleBan = (u: UserDoc) => setStatus(u, 'BANNED');

  // ---- ROLE CONTROLS ----

  const handleMakeAdmin = (u: UserDoc) =>
    handleUpdateUser(u.id || (u.uid as string), { role: 'ADMIN' });

  const handleMakeModerator = (u: UserDoc) =>
    handleUpdateUser(u.id || (u.uid as string), { role: 'MODERATOR' });

  const handleMakeUser = (u: UserDoc) =>
    handleUpdateUser(u.id || (u.uid as string), { role: 'USER' });

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
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Manage users</CardTitle>
              <p className="text-sm text-muted-foreground">
                Suspend, ban, or change roles (USER / MODERATOR / ADMIN).
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {usersLoading && (
              <div className="text-sm text-muted-foreground">
                Loading users…
              </div>
            )}

            {!usersLoading && (!users || users.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No users found.
              </div>
            )}

            {!usersLoading && users && users.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground px-2">
                  <div className="col-span-3">User</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Seller</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
                {users.map((u) => {
                  const id = u.id || (u.uid as string);
                  const isSeller = !!u.isSeller && !!u.storeId;
                  const status = (u.status || 'ACTIVE') as
                    | 'ACTIVE'
                    | 'LIMITED'
                    | 'BANNED';
                  const role = (u.role || 'USER') as
                    | 'USER'
                    | 'ADMIN'
                    | 'MODERATOR';

                  return (
                    <div
                      key={id}
                      className="grid grid-cols-12 items-center px-2 py-2 border rounded-md text-xs gap-2"
                    >
                      <div className="col-span-3 min-w-0">
                        <div className="font-semibold truncate">
                          {u.displayName || u.email || id}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {u.email}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Badge
                          variant={role === 'ADMIN' ? 'default' : 'outline'}
                        >
                          {role}
                        </Badge>
                      </div>

                      <div className="col-span-2">
                        <Badge
                          variant={
                            status === 'ACTIVE'
                              ? 'default'
                              : status === 'BANNED'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {status}
                        </Badge>
                      </div>

                      <div className="col-span-2">
                        {isSeller ? (
                          <Badge variant="outline">Seller</Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Not seller
                          </span>
                        )}
                      </div>

                      <div className="col-span-3 flex flex-wrap justify-end gap-1">
                        {/* Status buttons */}
                        {status !== 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingUserId === id}
                            onClick={() => handleUnsuspend(u)}
                          >
                            Unsuspend
                          </Button>
                        )}
                        {status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingUserId === id}
                            onClick={() => handleSuspend(u)}
                          >
                            Suspend
                          </Button>
                        )}
                        {status !== 'BANNED' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updatingUserId === id}
                            onClick={() => handleBan(u)}
                          >
                            Ban
                          </Button>
                        )}

                        {/* Role buttons */}
                        {role !== 'ADMIN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingUserId === id}
                            onClick={() => handleMakeAdmin(u)}
                          >
                            Make admin
                          </Button>
                        )}
                        {role !== 'MODERATOR' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingUserId === id}
                            onClick={() => handleMakeModerator(u)}
                          >
                            Make moderator
                          </Button>
                        )}
                        {role !== 'USER' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingUserId === id}
                            onClick={() => handleMakeUser(u)}
                          >
                            Make user
                          </Button>
                        )}

                        {isSeller && u.storeId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/store/${u.storeId}`)
                            }
                          >
                            View store
                          </Button>
                        )}
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
