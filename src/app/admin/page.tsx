
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

type UserDoc = {
  id?: string;
  uid?: string;
  email?: string;
  displayName?: string;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  status?: string;
  isSeller?: boolean;
  storeId?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const role = profile?.role;
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR';
  const isStaff = isAdmin || isModerator;

  // Extra guard (AdminLayout already blocks)
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isStaff) {
      router.replace('/');
    }
  }, [authLoading, user, isStaff, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const {
    data: users,
    isLoading: usersLoading,
  } = useCollection<UserDoc>(usersQuery);

  if (authLoading || !user || !isStaff) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  const totalUsers = users?.length ?? 0;
  const activeUsers = (users || []).filter(
    (u) => u.status === 'ACTIVE'
  ).length;
  const bannedUsers = (users || []).filter(
    (u) => u.status === 'BANNED'
  ).length;
  const sellers = (users || []).filter(
    (u) => u.isSeller && u.storeId
  ).length;
  const moderators = (users || []).filter(
    (u) => u.role === 'MODERATOR'
  ).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Staff Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Admin and moderation tools for HobbyDork.
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Role: {role}
          </Badge>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total users
              </CardTitle>
              <CardDescription className="text-xs">
                All registered accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersLoading ? '—' : totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeUsers} active • {bannedUsers} banned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Sellers
              </CardTitle>
              <CardDescription className="text-xs">
                Users with a storefront
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersLoading ? '—' : sellers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Can list items for sale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Staff count
              </CardTitle>
              <CardDescription className="text-xs">
                Admins and moderators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersLoading
                  ? '—'
                  : (users || []).filter(
                      (u) => u.role === 'ADMIN' || u.role === 'MODERATOR'
                    ).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {moderators} moderators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Your access
              </CardTitle>
              <CardDescription className="text-xs">
                Current signed-in staff account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{role}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isAdmin ? 'Full admin permissions' : 'Moderator permissions'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Users & bans
                </CardTitle>
                <CardDescription className="text-xs">
                  Roles, suspensions, and bans.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Promote users to moderators or admins, and change account
                  status (ACTIVE / LIMITED / BANNED).
                </p>
                <Button
                  size="sm"
                  className="inline-flex items-center gap-1"
                  onClick={() => router.push('/admin/users')}
                >
                  Open user manager
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Store Spotlight
                </CardTitle>
                <CardDescription className="text-xs">
                  Homepage store spotlight slots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Assign seller stores to the front-page spotlight and control
                  when they are live.
                </p>
                <Button
                  size="sm"
                  className="inline-flex items-center gap-1"
                  onClick={() => router.push('/admin/spotlight')}
                >
                  Manage spotlight
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Moderation tools
              </CardTitle>
              <CardDescription className="text-xs">
                Listings, ISO24, and community chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Quickly remove bad listings, ISO24 posts, or community messages.
                Admins can also suspend / ban owners from there.
              </p>
              <Button
                size="sm"
                className="inline-flex items-center gap-1"
                onClick={() => router.push('/admin/moderation')}
              >
                Open moderation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  User reports
                </CardTitle>
                <CardDescription className="text-xs">
                  Review reports submitted by users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  See reported users, listings, and messages, and update report
                  status (OPEN / IN&nbsp;PROGRESS / RESOLVED / DISMISSED).
                </p>
                <Button
                  size="sm"
                  className="inline-flex items-center gap-1"
                  onClick={() => router.push('/admin/reports')}
                >
                  Open reports
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
