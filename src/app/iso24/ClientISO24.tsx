'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import AppLayout from '@/components/layout/AppLayout';
import ISO24Card from '@/components/ISO24Card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { db } from '@/firebase/client-provider';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

import {
  ISO24_CATEGORY_OPTIONS,
  labelIso24Category,
  normalizeIso24Category,
} from '@/lib/iso24';

type Iso24Post = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  ownerUid?: string;
  status?: string;
  createdAt?: Timestamp;
  expiresAt?: Timestamp;
};

export default function ClientISO24() {
  const [posts, setPosts] = useState<Iso24Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ref = collection(db, 'iso24Posts');
        const q = query(ref, where('status', '==', 'OPEN'), orderBy('expiresAt', 'desc'));
        const snap = await getDocs(q);
        if (cancelled) return;
        setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (e) {
        // If permissions or indexes are misconfigured, don't silently fail.
        console.error('ISO24 load failed', e);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePosts = posts.filter((p) => {
    if (categoryFilter === 'ALL') return true;
    return normalizeIso24Category(p.category) === categoryFilter;
  });

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-4">
        <div className="rounded-xl border-2 border-black bg-card/70 overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <div className="relative h-28 sm:h-36 md:h-44 bg-muted">
            <Image
              src="/ISO.png"
              alt="ISO24"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">ISO24</h1>
              <p className="text-sm text-muted-foreground">
                Post what you’re looking for. People have 24 hours to help.
              </p>
            </div>
            <Link href="/iso24/create">
              <Button className="comic-button">Create ISO</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border-2 border-black bg-card/70 px-4 py-3 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <div className="text-sm font-semibold">Browse by category</div>
          <div className="w-full sm:w-64">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-2 border-black bg-muted/30">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {ISO24_CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading ISO posts…</div>}

        {!loading && posts.length === 0 && (
          <div className="text-sm text-muted-foreground">No open ISO posts right now.</div>
        )}

        {!loading && posts.length > 0 && visiblePosts.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No open ISO posts in {labelIso24Category(categoryFilter)}.
          </div>
        )}

        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <Link key={post.id} href={`/iso24/${post.id}`} className="block">
              <ISO24Card post={post as any} />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
