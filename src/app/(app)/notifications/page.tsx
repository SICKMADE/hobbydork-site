'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  MessageCircle,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Star,
} from 'lucide-react';

type NotificationDoc = {
  id?: string;
  type?: string; // 'MESSAGE' | 'ORDER' | 'ORDER_UPDATE' | 'REVIEW' | 'SYSTEM' | ...
  title?: string;
  body?: string;
  linkPath?: string; // e.g. "/messages/abc", "/orders/xyz"
  isRead?: boolean;
  createdAt?: any;
  readAt?: any | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const notifQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;

    return query(
      collection(
        firestore,
        'users',
        user.uid,
        'notifications',
      ),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, user?.uid]);

  const {
    data: notifications,
    isLoading,
  } = useCollection<NotificationDoc>(notifQuery as any);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to view notifications"
          description="You need to be logged in to see updates about messages and orders."
        >
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  const items = (notifications || []).map((n: any) => {
    const notif = n as NotificationDoc & { id: string };
    const created =
      notif.createdAt?.toDate?.() ?? null;
    const createdText =
      created &&
      formatDistanceToNow(created, { addSuffix: true });

    return {
      ...notif,
      id: notif.id,
      createdText,
      isRead: !!notif.isRead || !!notif.readAt,
    };
  });

  const unread = items.filter((n) => !n.isRead);

  const iconForType = (type?: string) => {
    switch (type) {
      case 'MESSAGE':
        return (
          <MessageCircle className="h-4 w-4 text-blue-500" />
        );
      case 'ORDER':
        return (
          <ShoppingBag className="h-4 w-4 text-emerald-500" />
        );
      case 'ORDER_UPDATE':
        return (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        );
      case 'REVIEW':
        return (
          <Star className="h-4 w-4 text-yellow-500" />
        );
      case 'ALERT':
        return (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        );
      default:
        return (
          <Bell className="h-4 w-4 text-primary" />
        );
    }
  };

  const handleOpen = async (notif: NotificationDoc & { id: string }) => {
    if (!firestore || !user) return;

    // mark as read
    try {
      await updateDoc(
        doc(
          firestore,
          'users',
          user.uid,
          'notifications',
          notif.id,
        ),
        {
          isRead: true,
          readAt: serverTimestamp(),
        },
      );
    } catch {
      // ignore, not fatal
    }

    if (notif.linkPath) {
      router.push(notif.linkPath);
    }
  };

  const handleMarkAllRead = async () => {
    if (!firestore || !user) return;
    if (unread.length === 0) return;

    const batch = writeBatch(firestore);

    unread.forEach((n) => {
      batch.update(
        doc(
          firestore,
          'users',
          user.uid,
          'notifications',
          n.id,
        ),
        {
          isRead: true,
          readAt: serverTimestamp(),
        },
      );
    });

    try {
      await batch.commit();
    } catch {
      // ignore
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Notifications
              </h1>
              <p className="text-xs text-muted-foreground">
                Updates about messages, orders, reviews, and more.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unread.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <PlaceholderContent
            title="You're all caught up"
            description="No notifications yet. You'll see new messages and order updates here."
          >
            <div className="mt-4 flex justify-center">
              <Button asChild>
                <Link href="/search">
                  Browse listings
                </Link>
              </Button>
            </div>
          </PlaceholderContent>
        )}

        {!isLoading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((notif) => (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-colors ${
                  notif.isRead
                    ? 'bg-background'
                    : 'bg-primary/5 border-primary/40'
                }`}
                onClick={() =>
                  handleOpen(notif as any)
                }
              >
                <CardHeader className="py-3 flex flex-row items-start gap-3">
                  <div className="mt-1">
                    {iconForType(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">
                      {notif.title || 'Notification'}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {notif.body ||
                        'You have a new update.'}
                    </CardDescription>
                    {notif.createdText && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {notif.createdText}
                      </p>
                    )}
                  </div>
                  {!notif.isRead && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
