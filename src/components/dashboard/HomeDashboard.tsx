import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SellerWarningIcon } from '@/components/SellerWarningIcon';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { useMemoFirebase, useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import StoreCard from '@/components/StoreCard';
import type { Store as StoreType, Listing } from '@/lib/types';
import { listingConverter, storeConverter, spotlightConverter } from '@/firebase/firestore/converters';
import { StandaloneVaultDoor } from './StandaloneVaultDoor';
import AskHobbyDork from './AskHobbyDork';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
        collection(firestore, 'stores'),
        where('isSpotlighted', '==', true),
        limit(20),
      ).withConverter(storeConverter);
    }, [firestore]);

    const { data: spotlightStores, isLoading } =
      useCollection<StoreType>(spotlightQuery);
    if (!spotlightStores) return null;

  // if (!spotlightStores || spotlightStores.length === 0) return null;

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
            {/* Spotlight badge overlay */}
            <span className="absolute top-2 left-2 z-10 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow">
              Spotlight
            </span>
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

        {/* Prevent ReferenceError when queries are commented out */}
        {typeof isLoading !== 'undefined' && isLoading && (
          <p className="text-xs text-muted-foreground">Loading spotlight…</p>
        )}

        <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
          {(Array.isArray(spotlightStores) ? spotlightStores : []).map((slot) => {
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
          // NotificationBell component removed as requested

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
    const username = owner?.displayName || owner?.email || "New Seller";
    const sellerTier = owner?.sellerTier || 'BRONZE';

    function renderTierBadge(tier: string) {
      tier = (tier || 'BRONZE').toUpperCase();
      let style = {};
      let className = 'ml-2 px-2 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border shadow-inner';
      if (tier === 'GOLD') {
        style = {
          background: 'linear-gradient(90deg, #fffbe6 0%, #ffe066 40%, #ffd700 60%, #fffbe6 100%)',
          color: '#a67c00',
          borderColor: '#ffd700',
          boxShadow: '0 1px 4px 0 #ffe06688, 0 0.5px 0 #fff inset',
        };
        className += ' border-yellow-400';
      } else if (tier === 'SILVER') {
        style = {
          background: 'linear-gradient(90deg, #f8f9fa 0%, #d1d5db 40%, #b0b4ba 60%, #f8f9fa 100%)',
          color: '#555',
          borderColor: '#b0b4ba',
          boxShadow: '0 1px 4px 0 #b0b4ba88, 0 0.5px 0 #fff inset',
        };
        className += ' border-gray-400';
      } else {
        style = {};
          className += ' border-orange-400 bg-orange-100 text-orange-700';
      }
      return <span className={className}>{tier} SELLER</span>;
    }

    return (
       <div className="relative flex flex-col items-center gap-2 text-center">
        <Link href={`/store/${store.storeId}`} className="block">
          <Avatar className="h-24 w-24 border-2 border-primary/50 transition-transform hover:scale-105">
            <AvatarImage src={cardImage} alt={store.storeName} />
            <AvatarFallback />
          </Avatar>
        </Link>
        <div className="text-xs mt-2">
          <p className="font-semibold truncate flex items-center justify-center">{store.storeName} {renderTierBadge(sellerTier)}</p>
          <p className="text-muted-foreground font-normal truncate">{username}</p>
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
        collection(firestore, 'stores'),
        where('status', '==', 'ACTIVE'),
        orderBy('createdAt', 'desc'),
        limit(18),
      ).withConverter(storeConverter);
    }, [firestore]);

    const { data: stores, isLoading } =
      useCollection<StoreType>(newStoresQuery);
    if (!stores) return null;

  // if (!stores || stores.length === 0) return null;

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
    if (!listings) return null;

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {listings.map((listing) => (
          <div key={listing.id || listing.listingId} className="max-w-[170px] min-w-[120px] mx-auto">
            <ListingCard
              listing={listing}
              compact
            />
          </div>
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
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 items-start">
        {/* VAULT */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-muted">
          <div className="relative w-64 h-32">
            <Image src="/vault.png" alt="Vault" fill className="object-contain" />
          </div>
          <div className="flex items-center justify-center">
            <StandaloneVaultDoor />
          </div>
          <p className="text-center text-sm text-muted-foreground max-w-md">

          </p>
        </div>

        {/* ASK HOBBYDORK */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-muted">
          <div className="relative w-64 h-32">
            <Image src="/ask.png" alt="ask" fill className="object-contain" />
          </div>
          <AskHobbyDork />
          <p className="text-center text-sm text-muted-foreground max-w-md "></p>
        </div>
      </div>
    </section>
  );
}
/* =======================
   Main Dashboard
   ======================= */

import type { User } from '@/lib/types';
interface HomeDashboardProps {
  user: User | null;
  profile: any; // Use the correct type for your profile if available
}

export default function HomeDashboard({ user, profile }: HomeDashboardProps) {
  const displayName = profile?.displayName ?? user?.email ?? 'Collector';
  const isSeller = profile?.isSeller;
  const loading = false; // Set this if you have a loading state

  // Dashboard search bar state/logic
  const [searchTerm, setSearchTerm] = React.useState('');
  const router = useRouter();
  const runSearch = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  };

  return (
    <div className="space-y-10 lg:space-y-12">
      {/* <BlindBidderSection /> */}
      {/* Hero header */}
      <header className="rounded-2xl border bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
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
          {/* Dashboard search bar */}
          <div className="flex flex-col gap-2 sm:gap-3 sm:items-center sm:justify-end w-full sm:w-auto mt-4 sm:mt-0">
            <div className="flex w-full sm:w-80 items-center gap-2">
              <span className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search listings, ISO posts, or stores..."
                  className="h-10 w-full rounded-full bg-white text-black placeholder:text-zinc-500 border-2 border-red-500 pl-9 pr-4 text-sm shadow-[2px_2px_0_rgba(0,0,0,0.35)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={onKeyDown}
                />
              </span>
              <Button
                type="button"
                aria-label="Search"
                onClick={runSearch}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
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
