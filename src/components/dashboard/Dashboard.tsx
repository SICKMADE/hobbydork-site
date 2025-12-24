


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
  doc,
} from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';

import { Button } from '@/components/ui/button';
import StoreCard from '@/components/StoreCard';
import type { Store as StoreType, User, Listing } from '@/lib/types';
import {
  listingConverter,
  storeConverter,
  spotlightConverter,
} from '@/firebase/firestore/converters';
import { StandaloneVaultDoor } from './StandaloneVaultDoor';
import AskHobbyDork from './AskHobbyDork';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Store } from 'lucide-react';
import ListingCard from '../ListingCard';
import { resolveAvatarUrl } from '@/lib/default-avatar';

import askImg from '../../../public/ask.png';
import vaultImg from '../../../public/vault.png';
import { Card, CardContent } from '../ui/card';

function ISO24PromoSection() {
  return (
    <section className="rounded-2xl border-2 border-black bg-card/80 p-4 sm:p-6 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-40 sm:h-20 sm:w-52 flex-shrink-0 rounded-xl border-2 border-black bg-muted overflow-hidden">
            <Image src="/ISO.png" alt="ISO24" fill className="object-contain" priority />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
              ISO24
            </p>
            <h2 className="mt-1 text-xl font-semibold">Post what you’re hunting</h2>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-xl">
              Categories + a 24-hour timer keep it fresh. See what’s expiring soon and help someone complete their chase.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-2 border-black bg-muted/40 hover:bg-muted/60"
          >
            <Link href="/iso24">Browse ISO24</Link>
          </Button>
          <Button asChild size="sm" className="comic-button">
            <Link href="/iso24/create">Create ISO</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

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
    ).withConverter(storeConverter);
  }, [firestore]);

  const { data: spotlightStores, isLoading } =
    useCollection<StoreType>(spotlightQuery);

  if (!spotlightStores || spotlightStores.length === 0) return null;

  return (
    <section className="relative rounded-2xl border border-amber-500/80 bg-card/95 p-[1px] shadow-[0_0_25px_rgba(251,191,36,0.35)]">
      {/* Static glow frame around the whole strip */}
      <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-[radial-gradient(circle_at_0_0,rgba(251,191,36,0.30),transparent_55%),radial-gradient(circle_at_100%_0,rgba(251,191,36,0.18),transparent_55%),radial-gradient(circle_at_0_100%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(251,191,36,0.30),transparent_55%)] opacity-70" />

      {/* Content */}
      <div className="relative rounded-2xl bg-zinc-950/95 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative h-16 w-40 sm:h-20 sm:w-52 flex-shrink-0 rounded-xl border-2 border-black bg-muted overflow-hidden">
              <Image src="/SPOTLIGHT.png" alt="Store Spotlight" fill className="object-contain" priority />
            </div>

            <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/90">
                
              </p>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                Paid
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold">
              
            </h2>
            <p className="mt-1 max-w-xl text-[11px] text-muted-foreground">
            </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-2 border-black bg-muted/40 hover:bg-muted/60"
          >
            <Link href="/search">Browse all stores</Link>
          </Button>
        </div>

        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading spotlight…</p>
        )}

        <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
          {spotlightStores.map((slot) => {
            const storeWithId = {
              ...slot,
              storeId: slot.storeId ?? slot.id,
              isSpotlighted: true,
            } as StoreType;

            return (
              <div
                key={storeWithId.storeId}
                className="flex-[0_0_240px] sm:flex-[0_0_280px] md:flex-[0_0_320px] max-w-[360px]"
              >
                <StoreCard
                  store={storeWithId}
                  cardImage={storeWithId.storeImageUrl || '/store.png'}
                  layout="spotlight"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =====================
// New Store Card for "Fresh Faces"
// =====================
function NewStoreCard({ store }: { store: StoreType }) {
    const firestore = useFirestore();

    const ownerRef = useMemoFirebase(() => {
        if (!firestore || !store.ownerUid) return null;
        return doc(firestore, 'users', store.ownerUid);
    }, [firestore, store.ownerUid]);
    
    const { data: owner } = useDoc<User>(ownerRef);
    const cardImage = resolveAvatarUrl(owner?.avatar, store.ownerUid);

    return (
       <div className="relative flex flex-col items-center gap-2 text-center">
            <Link href={`/store/${store.storeId}`} className="block">
                <Avatar className="h-24 w-24 border-2 border-primary/50 transition-transform hover:scale-105">
                    <AvatarImage src={cardImage} alt={store.storeName} />
                  <AvatarFallback />
                </Avatar>
            </Link>
            <div className="text-xs mt-2">
                <p className="font-semibold truncate">{store.storeName}</p>
                <Button asChild variant="link" className="h-auto p-0 text-xs">
                    <Link href={`/store/${store.storeId}`}>Visit Store</Link>
                </Button>
            </div>
        </div>
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
    ).withConverter(storeConverter);
  }, [firestore]);

  const { data: stores, isLoading } =
    useCollection<StoreType>(newStoresQuery);

  if (!stores || stores.length === 0) return null;

  return (
    <section className="rounded-2xl border-2 border-black bg-card/80 p-4 sm:p-6 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
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
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-2 border-black bg-muted/40 hover:bg-muted/60"
        >
          <Link href="/stores">Browse stores</Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading stores…</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {stores.map((store) => {
          const id = store.storeId ?? store.id;
          if (!id) return null;

          const storeWithId = {
            ...store,
            storeId: id,
          } as StoreType;

          return (
            <div
              key={id}
            >
              <NewStoreCard store={storeWithId} />
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
      limit(12),
    ).withConverter(listingConverter);
  }, [firestore]);

  const { data: listings, isLoading: listingsLoading } =
    useCollection<Listing>(newListingsQuery);

  if (!listings || listings.length === 0) return null;

  return (
    <section className="rounded-2xl border-2 border-black bg-card/80 p-4 sm:p-6 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-400/80">
            Newly Listed
          </p>
          <h2 className="text-xl font-semibold">Fresh in the Market</h2>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-2 border-black bg-muted/40 hover:bg-muted/60"
        >
          <Link href="/search">Browse all listings</Link>
        </Button>
      </div>

      {listingsLoading && (
        <p className="text-xs text-muted-foreground">Loading listings…</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id || listing.listingId}
            listing={listing}
          />
        ))}
      </div>
    </section>
  );
}

/* =======================
   Vault + Genie combined section
   ======================= */

/* =======================
   VAULT + ASK (FIXED)
======================= */

function VaultAndGenieSection() {
  return (
    <section className="rounded-2xl border-2 border-black bg-card/80 p-6 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* VAULT */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-muted">
          <div className="relative w-64 h-32">
            <Image src="/vault.png" alt="Vault" fill className="object-contain" />
          </div>
          <div className="flex items-center justify-center">
            <StandaloneVaultDoor />
          </div>
          <p className="text-center text-sm text-muted-foreground max-w-md">
            Somewhere on this site is a <b>4-digit pin</b>.  
            Find it. Enter it. Win something nice.  
            Clues drop—pay attention.
          </p>
        </div>

        {/* ASK HOBBYDORK */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-muted">
          <div className="relative w-64 h-32">
            <Image src="/ask.png" alt="ask" fill className="object-contain" />
          </div>
          <AskHobbyDork />
          <p className="text-center text-sm text-muted-foreground max-w-md ">Can't Make Up Your Mind? Let HobbbyDork Decide.</p>
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
  const isSeller = profile?.isSeller;

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
              See what's hot, who's new, maybe list a item or two! Can't decide? Let HobbyDork help you.
              Along the way don't forget keep your eyes peeled for HobbyDork's hidden 4 digit pin. 
              
            </p>
          </div>
          <div className="flex gap-3">
            {!isSeller ? (
              <Button
                asChild
                variant="outline"
                className="hidden sm:inline-flex border-2 border-black bg-muted/40 hover:bg-muted/60 text-green-600"
              >
                <Link href="/store/setup">Apply to Become a Seller</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="hidden sm:inline-flex border-2 border-black bg-muted/40 hover:bg-muted/60"
              >
                <Link href="/search">Browse listings</Link>
              </Button>
            )}
            <Button asChild className="comic-button">
              <Link href="/listings/create">Create listing</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Rows */}
      <ISO24PromoSection />
      <SpotlightStoresSection />
      <NewStoresSection />
      <NewListingsSection />
      <VaultAndGenieSection />
    </div>
  );
}
