'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import ISO24Card from '@/components/ISO24Card';
import { Button } from '@/components/ui/button';

import { db } from '@/firebase/client-provider';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

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

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">ISO24</h1>
          <Link href="/iso24/create">
            <Button>Create ISO</Button>
          </Link>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading ISO posts…</div>}

        {!loading && posts.length === 0 && (
          <div className="text-sm text-muted-foreground">No open ISO posts right now.</div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/iso24/${post.id}`} className="block">
              <ISO24Card post={post as any} />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
