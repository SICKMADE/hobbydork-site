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

import vaultImg from './hobbydork-vault.png';
import genieImg from './genie.png';

/* =======================
   Ask HobbyDork (8-ball)
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

function AskHobbyDorkSection() {
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
    <div className="rounded-2xl border bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-black p-6 sm:p-8 shadow-xl h-full">
      <div className="grid items-center gap-6 sm:grid-cols-[auto,minmax(0,1fr)]">
        <div className="flex justify-center">
          <Image
            src={genieImg}
            alt="genie"
            className="h-auto w-32 sm:w-40 drop-shadow-[0_0_18px_rgba(0,0,0,0.75)]"
            priority
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
              HobbyDork Genie
            </p>
            <h2 className="text-3xl font-black uppercase tracking-[0.18em]">
              Ask The Vault
            </h2>
            <p className="text-xs text-muted-foreground">
              Hit one of the buttons and let HobbyDork give you a brutally honest answer.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAsk('BUY')}
              disabled={isThinking}
              className="border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/15"
            >
              Should I buy this item?
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAsk('SELL')}
              disabled={isThinking}
              className="border-rose-500/60 bg-rose-500/5 hover:bg-rose-500/15"
            >
              Should I sell this item?
            </Button>
          </div>

          <div className="mt-2 rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm">
            {isThinking && (
              <p className="text-muted-foreground">
                HobbyDork is flipping a coin in the back room…
              </p>
            )}
            {!isThinking && answer && label && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-base font-semibold">{answer}</p>
              </div>
            )}
            {!isThinking && !answer && (
              <p className="text-muted-foreground">
                Pick BUY or SELL and let the genie decide your fate.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   Vault Easter egg card
   ======================= */

function VaultEasterEggSection() {
  return (
    <div className="space-y-6 rounded-2xl border bg-card/90 p-6 shadow-md sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex justify-center md:justify-start">
          <Image
            src={vaultImg}
            alt="HobbyDork trying to unlock the vault"
            className="max-h-40 w-auto drop-shadow-[0_0_18px_rgba(0,0,0,0.7)]"
            priority
          />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-yellow-400/80">
            Easter Egg
          </p>
          <h2 className="text-2xl font-semibold">
            Can you unlock the HobbyDork vault?
          </h2>
          <p className="text-sm text-muted-foreground">
            Tap the door, punch in the secret 4-digit PIN, and hit the winner
            screen if you get it right.
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <StandaloneVaultDoor />
      </div>
    </div>
  );
}

/* =======================
   Store Spotlight row
   (static glow around whole row)
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
              <span className="rounded-full bg-amber-400 text-[10px] font-semibold uppercase tracking-[0.2em] text-black px-2 py-0.5">
                Paid
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold">
              Featured HobbyDork Stores
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-xl">
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
                {/* Uses your existing StoreCard; card size unchanged */}
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
              <div className="relative w-full aspect-[4/3] bg-black/40">
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
   ISO24 row
   ======================= */

function ISO24SummarySection() {
  const firestore = useFirestore();

  const isoQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'iso24Posts'),
      where('status', '==', 'ACTIVE'),
      orderBy('expiresAt', 'asc'),
      limit(20),
    );
  }, [firestore]);

  const { data: isoPosts, isLoading } =
    useCollection<any>(isoQuery);

  if (!isoPosts || isoPosts.length === 0) return null;

  const formatCategory = (cat: string | undefined) =>
    (cat || '')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const timeLeft = (expiresAt: any) => {
    if (!expiresAt?.toDate) return '';
    const ms = expiresAt.toDate().getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  return (
    <section className="rounded-2xl border bg-card/90 p-4 sm:p-6 shadow-md h-full">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-fuchsia-400/80">
            ISO24
          </p>
          <h2 className="text-xl font-semibold">In Search Of (24 hours)</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/iso24">View all</Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">
          Loading ISO posts…
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {isoPosts.map((iso: any) => (
          <div
            key={iso.id ?? iso.isoId}
            className="flex w-64 flex-[0_0_auto] flex-col rounded-xl border bg-background/90 p-3 text-xs"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {formatCategory(iso.category)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {timeLeft(iso.expiresAt)}
              </span>
            </div>
            <p className="line-clamp-2 text-[13px] font-semibold">
              {iso.title}
            </p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-[12px] text-muted-foreground">
              {iso.description}
            </p>
          </div>
        ))}
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

  const isSeller = !!profile?.isSeller && !!profile?.storeId;

  const primaryCtaLabel = !profile
    ? 'Sign in to sell'
    : isSeller
    ? 'Create listing'
    : 'Become a seller';

  const primaryCtaHref = !profile
    ? '/login?redirect=/listings'
    : isSeller
    ? '/listings/create'
    : '/store/setup?redirect=/listings';

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
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              See what&apos;s hot, what just hit the vault, and crack open the secret
              HobbyDork Vault to win something crazy!.
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
            <Button asChild disabled={loading}>
              <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Rows */}
      <SpotlightStoresSection />
      <NewListingsSection />
      
      {/* ISO and Genie row */}
      <section className="grid gap-6 md:grid-cols-2">
        <ISO24SummarySection />
        <AskHobbyDorkSection />
      </section>
      
      {/* Vault section */}
      <VaultEasterEggSection />
    </div>
  );
}
