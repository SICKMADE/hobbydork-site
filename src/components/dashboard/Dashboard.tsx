'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  collection,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import { Button } from '@/components/ui/button';
import StoreCard from '@/components/StoreCard';
import type { Store as StoreType } from '@/lib/types';
import { StandaloneVaultDoor } from './StandaloneVaultDoor';

import genieImg from './genie.png';

/* =======================
   Ask HobbyDork (8-ball) helpers
   ======================= */

const BUY_ANSWERS = [
  'Yeah, you should buy it.',
  'Looks good. Pull the trigger.',
  'If you really want it, grab it.',
  'This one belongs in your collection.',
  'Only buy it if you love it.',
  'It’s fine, but you don’t need it.',
  'Pass. This one is not worth it.',
  'Condition and price don’t line up. Skip it.',
  'Wait for a cleaner copy.',
  'Hold off. A better deal will show up.',
];

const SELL_ANSWERS = [
  'Yeah, you should sell it.',
  'Move it and upgrade later.',
  'Dump it. You won’t miss it.',
  'Sell it and chase something you actually want.',
  'Easy to replace? Then list it.',
  'Keep it. You’re not done with this one.',
  'Hold it a bit longer.',
  'If you still like it, don’t sell it.',
  'This belongs in your collection, not on a sales table.',
  'Sell something you care about less.',
];

function getRandomAnswer(type: 'BUY' | 'SELL') {
  const pool = type === 'BUY' ? BUY_ANSWERS : SELL_ANSWERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* =======================
   Spotlight stores
   ======================= */

function SpotlightStoresSection() {
  const firestore = useFirestore();

  const spotlightQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'storefronts'),
      where('isSpotlighted', '==', true),
      limit(20),
    );
  }, [firestore]);

  const { data: spotlightStores, isLoading } =
    useCollection<StoreType>(spotlightQuery as any);

  if (!spotlightStores || spotlightStores.length === 0) return null;

  return (
    <section className="relative rounded-2xl border border-amber-500/80 bg-card/95 p-[1px] shadow-[0_0_25px_rgba(251,191,36,0.35)]">
      {/* Static glow frame around the whole strip */}
      <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-[radial-gradient(circle_at_0_0,rgba(251,191,36,0.30),transparent_55%),radial-gradient(circle_at_100%_0,rgba(251,191,36,0.18),transparent_55%),radial-gradient(circle_at_0_100%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(251,191,36,0.30),transparent_55%)] opacity-70" />

      {/* Content */}
      <div className="relative rounded-2xl bg-zinc-950/95 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/90">
                Store Spotlight
              </p>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                Paid
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold">
              Featured HobbyDork Stores
            </h2>
            <p className="mt-1 max-w-xl text-[11px] text-muted-foreground">
              Weekly paid spots from the HobbyDork Market. Scroll sideways to
              see who bought their way to the front of the vault.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/search">Browse all stores</Link>
          </Button>
        </div>

        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading spotlight…</p>
        )}

        <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
          {spotlightStores.map((slot) => {
            const storeWithId = {
              ...(slot as any),
              storeId: (slot as any).storeId ?? (slot as any).id,
              isSpotlighted: true,
            } as StoreType;

            return (
              <div
                key={storeWithId.storeId}
                className="flex-[0_0_280px] max-w-[320px]"
              >
                <StoreCard store={storeWithId} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =======================
   New stores (recent storefronts)
   ======================= */

function NewStoresSection() {
  const firestore = useFirestore();

  const newStoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'storefronts'),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(18),
    );
  }, [firestore]);

  const { data: stores, isLoading } =
    useCollection<StoreType>(newStoresQuery as any);

  if (!stores || stores.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card/90 p-4 sm:p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
            New Stores
          </p>
          <h2 className="text-xl font-semibold">Fresh faces in the Vault</h2>
          <p className="text-[11px] text-muted-foreground">
            Stores that just opened up shop on HobbyDork.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/search?tab=stores">Browse stores</Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading stores…</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {stores.map((store) => {
          const id = (store as any).storeId ?? (store as any).id;
          if (!id) return null;

          const storeWithId = {
            ...(store as any),
            storeId: id,
          } as StoreType;

          return (
            <div
              key={id}
              className="flex-[0_0_260px] max-w-xs"
            >
              <StoreCard store={storeWithId} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =======================
   Newly Listed row
   ======================= */

function NewListingsSection() {
  const firestore = useFirestore();

  const newListingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'listings'),
      where('state', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(24),
    );
  }, [firestore]);

  const { data: listings, isLoading } =
    useCollection<any>(newListingsQuery);

  if (!listings || listings.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card/90 p-4 sm:p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-400/80">
            Newly Listed
          </p>
          <h2 className="text-xl font-semibold">Fresh in the Vault</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/search">Browse all listings</Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading listings…</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {listings.map((l: any, index: number) => {
          const primaryUrl =
            l.primaryImageUrl ||
            (Array.isArray(l.imageUrls) && l.imageUrls[0]) ||
            null;

          return (
            <Link
              key={l.listingId ?? l.id}
              href={`/listings/${l.listingId ?? l.id}`}
              className="group flex w-60 flex-[0_0_auto] flex-col overflow-hidden rounded-xl border bg-background/90 text-left shadow-sm transition hover:border-primary hover:bg-background"
            >
              <div className="relative aspect-[4/3] w-full bg-black/40">
                {primaryUrl && (
                  <Image
                    src={primaryUrl}
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 40vw, 80vw"
                    priority={index === 0}
                    className="object-cover transition group-hover:scale-105"
                  />
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-xs font-semibold">
                  {l.title}
                </p>
                <p className="text-sm font-bold">
                  $
                  {typeof l.price === 'number'
                    ? l.price.toFixed(2)
                    : Number(l.price || 0).toFixed(2)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =======================
   Vault + Genie combined section
   ======================= */

function VaultAndGenieSection() {
  const [question, setQuestion] = useState<'BUY' | 'SELL' | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleAsk = (type: 'BUY' | 'SELL') => {
    setQuestion(type);
    setIsThinking(true);

    setTimeout(() => {
      setAnswer(getRandomAnswer(type));
      setIsThinking(false);
    }, 500);
  };

  const label =
    question === 'BUY'
      ? 'Should I buy this item?'
      : question === 'SELL'
      ? 'Should I sell this item?'
      : null;

  return (
    <section className="rounded-2xl border bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-6 sm:p-8 shadow-xl">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        {/* Left: Vault / Easter egg */}
        <div className="space-y-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex justify-center sm:justify-start">
              <div className="rounded-2xl border border-zinc-700/70 bg-black/50 p-3">
                <StandaloneVaultDoor />
              </div>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-yellow-300/80">
                Hidden Vault
              </p>
              <h2 className="text-2xl font-semibold">
                Unlock the HobbyDork vault?
              </h2>
              <p className="text-sm text-muted-foreground">
                Tap the door, punch in the secret 4-digit PIN, and hit the winner
                screen if you guess it.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Ask HobbyDork (BUY / SELL) */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-black/50 p-4 sm:p-5">
          <div className="flex w-full items-start gap-3">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
                HobbyDork Genie
              </p>
              <h3 className="text-5xl font-bold uppercase tracking-wider">
                Ask HobbyDork
              </h3>
              <p className="text-xs text-muted-foreground pt-1">
                Can't decide? Let the HobbyDork genie determine your fate.
              </p>
            </div>
            <Image
              src={genieImg}
              alt="HobbyDork genie"
              className="w-24 sm:w-28 drop-shadow-[0_0_22px_rgba(0,0,0,0.9)]"
              priority
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleAsk('BUY')}
              disabled={isThinking}
              className="flex-1 border-emerald-500/60 bg-emerald-500/5 text-base hover:bg-emerald-500/15"
            >
              Should I BUY?
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleAsk('SELL')}
              disabled={isThinking}
              className="flex-1 border-rose-500/60 bg-rose-500/5 text-base hover:bg-rose-500/15"
            >
              Should I SELL?
            </Button>
          </div>

          <div className="mt-2 w-full rounded-xl border border-zinc-800 bg-black/60 p-4 text-center">
            {isThinking && (
              <p className="text-lg text-muted-foreground">
                The genie is thinking...
              </p>
            )}
            {!isThinking && answer && label && (
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-xl font-bold text-primary">{answer}</p>
              </div>
            )}
            {!isThinking && !answer && (
              <p className="text-lg text-muted-foreground">
                The Vault awaits your question.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =======================
   Main Dashboard
   ======================= */

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const displayName = profile?.displayName ?? 'Collector';

  return (
    <div className="space-y-10 lg:space-y-12">
      {/* Hero header */}
      <header className="rounded-2xl border bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
              HobbyDork Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Welcome, {loading ? '...' : displayName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              See what's hot, what just hit the vault, and crack open the secret
              HobbyDork Vault to win something crazy.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              variant="outline"
              className="hidden sm:inline-flex"
            >
              <Link href="/search">Browse listings</Link>
            </Button>
            <Button asChild>
              <Link href="/listings/create">Create listing</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Rows */}
      <SpotlightStoresSection />
      <NewStoresSection />
      <NewListingsSection />
      <VaultAndGenieSection />
    </div>
  );
}
