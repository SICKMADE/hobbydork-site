'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  where,
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';

type ConversationDoc = {
  id?: string;
  participants?: string[];
  participantUids?: string[];
  participantDisplayNames?: Record<string, string>;
  participantAvatarUrls?: Record<string, string>;
  lastMessageText?: string;
  lastMessageSenderUid?: string;
  lastMessageAt?: any;
  createdAt?: any;
};


export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  // Just filter by participants; we'll sort in JS
  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
  
    return query(
      collection(firestore, 'conversations'),
      where('participantUids', 'array-contains', user.uid),
    );
  }, [firestore, user?.uid]);
  

  const {
    data: conversations,
    isLoading,
  } = useCollection<ConversationDoc>(conversationsQuery as any);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-48" />
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
          title="Sign in to view messages"
          description="You need to be logged in to see your conversations."
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

  // Normalize & sort by lastMessageAt (newest first)
  const items = (conversations || [])
  .map((c: any) => {
    const conv = c as ConversationDoc & { id: string };
    const participantArray =
      conv.participants || conv.participantUids || [];
    const otherUid =
      participantArray.find((p) => p !== user.uid) || '';
    const otherName =
      conv.participantDisplayNames?.[otherUid] || 'User';
    const otherAvatar =
      conv.participantAvatarUrls?.[otherUid] || '';


      const lastAt = conv.lastMessageAt?.toDate
        ? conv.lastMessageAt.toDate()
        : null;
      const lastAtText =
        lastAt &&
        formatDistanceToNow(lastAt, { addSuffix: true });

      const tsForSort = lastAt
        ? lastAt.getTime()
        : conv.createdAt?.toDate
          ? conv.createdAt.toDate().getTime()
          : 0;

      return {
        id: conv.id!,
        otherUid,
        otherName,
        otherAvatar,
        lastMessageText:
          conv.lastMessageText || 'Tap to view conversation',
        lastAtText,
        sortKey: tsForSort,
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Messages
              </h1>
              <p className="text-xs text-muted-foreground">
                Private conversations with other collectors.
              </p>
            </div>
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
            title="No messages yet"
            description="Start a conversation from a listing, store page, or user profile."
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
            {items.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() =>
                  router.push(`/messages/${conv.id}`)
                }
              >
                <CardHeader className="py-3 flex flex-row items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={conv.otherAvatar} />
                    <AvatarFallback>
                      {conv.otherName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">
                      {conv.otherName}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {conv.lastMessageText}
                    </CardDescription>
                  </div>
                  {conv.lastAtText && (
                    <span className="text-[11px] text-muted-foreground">
                      {conv.lastAtText}
                    </span>
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
