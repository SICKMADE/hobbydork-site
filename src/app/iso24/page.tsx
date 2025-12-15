
'use client';

import { useState } from 'react';
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
  where,
  orderBy,
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, PlusCircle } from 'lucide-react';

type ISO24Post = {
  id?: string;
  title: string;
  description: string;
  category:
    | 'COMIC_BOOKS'
    | 'SPORTS_CARDS'
    | 'POKEMON_CARDS'
    | 'VIDEO_GAMES'
    | 'TOYS'
    | 'OTHER';
  status: string;
  ownerUid: string;
  expiresAt?: any;
  createdAt?: any;
};

const CATEGORY_LABELS: Record<ISO24Post['category'], string> = {
  COMIC_BOOKS: 'Comic books',
  SPORTS_CARDS: 'Sports cards',
  POKEMON_CARDS: 'Pokémon cards',
  VIDEO_GAMES: 'Video games',
  TOYS: 'Toys',
  OTHER: 'Other',
};

export default function ISO24Page() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const [categoryFilter, setCategoryFilter] =
    useState<'ALL' | ISO24Post['category']>('ALL');

  const now = new Date();

  const isoQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;

    // Only ACTIVE ISO posts that haven't expired yet
    return query(
      collection(firestore, 'iso24Posts'),
      where('status', '==', 'ACTIVE'),
      where('expiresAt', '>=', now),
      orderBy('expiresAt', 'asc'),
    );
  }, [firestore, user?.uid, now]);

  const {
    data: isoPosts,
    isLoading,
  } = useCollection<ISO24Post>(isoQuery as any);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to view ISO posts"
          description="You need to be logged in to see and create In Search Of posts."
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

  // Convert snapshots to usable objects
  const items = (isoPosts || []).map((snap: any) => {
    const p = snap as ISO24Post & { id: string };
    const expires =
      p.expiresAt?.toDate?.() ?? null;
    const created =
      p.createdAt?.toDate?.() ?? null;

    const expiresText =
      expires &&
      formatDistanceToNow(expires, {
        addSuffix: true,
      });

    return {
      ...p,
      id: p.id,
      expires,
      created,
      expiresText,
    };
  });

  // Filter by category locally
  const filtered =
    categoryFilter === 'ALL'
      ? items
      : items.filter(
          (p) => p.category === categoryFilter,
        );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ISO 24
              </h1>
              <p className="text-xs text-muted-foreground">
                Post what you’re looking for and other
                collectors can message you. Posts auto-expire
                after 24 hours.
              </p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="gap-1"
          >
            <Link href="/iso24/create">
              <PlusCircle className="h-4 w-4" />
              Post an ISO
            </Link>
          </Button>
        </div>

        {/* Category tabs */}
        <Tabs
          value={categoryFilter}
          onValueChange={(v) =>
            setCategoryFilter(
              v as 'ALL' | ISO24Post['category'],
            )
          }
        >
          <TabsList className="flex flex-wrap justify-start">
            <TabsTrigger
              value="ALL"
              className="text-xs md:text-sm"
            >
              All
            </TabsTrigger>
            {(
              [
                'COMIC_BOOKS',
                'SPORTS_CARDS',
                'POKEMON_CARDS',
                'VIDEO_GAMES',
                'TOYS',
                'OTHER',
              ] as ISO24Post['category'][]
            ).map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs md:text-sm"
              >
                {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <PlaceholderContent
            title="No active ISO posts"
            description="Be the first to post what you’re hunting for today."
          >
            <div className="mt-4 flex justify-center">
              <Button asChild>
                <Link href="/iso24/create">
                  Post an ISO
                </Link>
              </Button>
            </div>
          </PlaceholderContent>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((post) => (
              <Card
                key={post.id}
                className="border-l-4 border-l-primary"
              >
                <CardHeader className="pb-2 flex flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm md:text-base">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm line-clamp-2">
                      {post.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="text-[11px] md:text-xs"
                    >
                      {CATEGORY_LABELS[post.category]}
                    </Badge>
                    {post.expiresText && (
                      <span className="text-[11px] text-muted-foreground">
                        Expires {post.expiresText}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-1 flex justify-between items-center">
                  <p className="text-[11px] md:text-xs text-muted-foreground">
                    People can DM you directly about this ISO.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <Link
                      href={`/messages/new?recipientUid=${post.ownerUid}`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message poster
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
