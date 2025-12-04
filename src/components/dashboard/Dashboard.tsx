'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, orderBy, limit } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';

import { Button } from '../ui/button';
import { StandaloneVaultDoor } from './StandaloneVaultDoor';

import vaultImg from './hobbydork-vault.png';
import genieImg from './hobbydork-genie.png';

// ----------------------
// Ask HobbyDork 8-ball
// ----------------------

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
    <section className="rounded-2xl border bg-card/80 p-6 sm:p-8 shadow-md">
      <div className="grid items-center gap-6 sm:grid-cols-[auto,minmax(0,1fr)]">
        {/* Genie image */}
        <div className="flex justify-center">
          <Image
            src={genieImg}
            alt="HobbyDork genie"
            className="h-auto w-28 sm:w-36"
            priority
          />
        </div>

        {/* Text + controls */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold uppercase tracking-[0.2em] text-primary drop-shadow-md">
              Ask HobbyDork
            </h2>
            <p className="text-xs text-muted-foreground">
              Magic 8-Ball style. Pick a question and let HobbyDork decide.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAsk('BUY')}
              disabled={isThinking}
            >
              Should I buy this item?
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAsk('SELL')}
              disabled={isThinking}
            >
              Should I sell this item?
            </Button>
          </div>

          <div className="mt-2 rounded-lg border bg-background/60 p-4 text-sm">
            {isThinking && (
              <p className="text-muted-foreground">
                HobbyDork is thinking about it...
              </p>
            )}
            {!isThinking && answer && label && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-base font-semibold">{answer}</p>
              </div>
            )}
            {!isThinking && !answer && (
              <p className="text-muted-foreground">
                Pick one of the questions above and HobbyDork will give you an
                answer.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ----------------------
// Dashboard
// ----------------------

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const firestore = useFirestore();
  const displayName = profile?.displayName ?? 'HobbyDork';

  // Store Spotlight uses spotlightSlots, not storefronts
  const spotlightQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    return query(
      collection(firestore, 'spotlightSlots'),
      orderBy('createdAt', 'desc'),
      limit(4),
    );
  }, [firestore]);

  const {
    data: spotlightSlots,
    isLoading: spotlightLoading,
    error: spotlightError,
  } = useCollection(spotlightQuery);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {loading ? '...' : displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the Store Spotlight, help HobbyDork unlock the vault, and ask
            if you should buy or sell.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/search">Search HobbyDork</Link>
          </Button>
          <Button asChild>
            <Link href="/listings/create">Create listing</Link>
          </Button>
        </div>
      </header>

      {/* STORE SPOTLIGHT – from spotlightSlots */}
      <section className="rounded-2xl border bg-card/80 p-6 sm:p-8 shadow-md">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Store Spotlight
            </p>
            <h2 className="text-lg font-semibold">
              Featured HobbyDork stores this week
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When sellers buy spotlight slots, their stores show up here.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/browse">View marketplace</Link>
          </Button>
        </div>

        {spotlightLoading && (
          <p className="text-sm text-muted-foreground">
            Loading spotlight stores...
          </p>
        )}

        {spotlightError && (
          <p className="text-sm text-destructive">
            Couldn&apos;t load spotlight stores right now.
          </p>
        )}

        {spotlightSlots && spotlightSlots.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {spotlightSlots.map((slot: any) => {
              const storeId = slot.storeId ?? slot.storeRef ?? slot.id;
              const storeName = slot.storeName ?? 'Spotlight store';
              const blurb =
                slot.blurb ||
                slot.tagline ||
                'Tap to view this HobbyDork store and see what they have listed.';

              return (
                <Link
                  key={slot.id}
                  href={storeId ? `/store/${storeId}` : '#'}
                  className="group rounded-xl border bg-background/60 p-4 shadow-sm transition hover:border-primary hover:bg-background"
                >
                  <h3 className="text-base font-semibold group-hover:text-primary">
                    {storeName}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                    {blurb}
                  </p>
                  {storeId && (
                    <p className="mt-3 text-xs font-medium text-primary">
                      View store →
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : !spotlightLoading && !spotlightError ? (
          <p className="text-sm text-muted-foreground">
            No spotlight stores yet. Once you start selling spotlight spots,
            they&apos;ll appear here.
          </p>
        ) : null}
      </section>

      {/* Vault section */}
      <section className="max-w-4xl mx-auto rounded-2xl border bg-card/80 p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex justify-center md:justify-start">
            <Image
              src={vaultImg}
              alt="HobbyDork trying to unlock the vault"
              className="max-h-40 w-auto"
              priority
            />
          </div>
          <div className="text-center md:text-left space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Easter Egg
            </p>
            <h2 className="text-2xl font-semibold">
              Can you unlock the HobbyDork safe?
            </h2>
            <p className="text-sm text-muted-foreground">
              Help HobbyDork unlock the vault. Tap the door and enter the secret
              4-digit PIN. Get it right and you&apos;ll hit the winner&apos;s screen.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <StandaloneVaultDoor />
        </div>
      </section>

      {/* Ask HobbyDork */}
      <AskHobbyDorkSection />
    </div>
  );
}
