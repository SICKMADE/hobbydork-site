'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import StoreSpotlight from '@/components/StoreSpotlight';
import { type Listing } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  CheckCircle2,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  X,
  Users,
  Zap,
  ChevronRight,
  Terminal,
  Scan,
  Loader2,
  Activity,
  KeyRound,
  Cpu,
  Clock,
  CircleDot
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const HERO_SLIDES = [
  { 
    id: "vault", 
    image: "/banner/vault.jpg",
    href: "/#vault-section", 
    title: "UNLOCK", 
    highlight: "THE VAULT",
    sub: "COLLECTOR REWARDS",
    intel: (
      ({ navigate }: { navigate?: (url: string) => void }) => (
        <>
          Find the 4-digit PIN&mdash;it's hidden somewhere on this site. For more details,{' '}
          <span
            className="underline text-accent hover:text-accent/80 cursor-pointer"
            onClick={e => {
              e.preventDefault();
              if (navigate) navigate('/help#vault-pin');
            }}
            tabIndex={0}
            role="button"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (navigate) navigate('/help#vault-pin');
              }
            }}
            aria-label="See the Help Center for more details about the Vault Pin Challenge"
          >
            see the Help Center
          </span>.
        </>
      )
    ),
    tag: "PLATFORM GAME // VAULT",
  },
  { 
    id: "social", 
    image: "/banner/socialmarketplace.jpg",
    href: "/community-chat", 
    title: "COLLECTOR", 
    highlight: "CHAT",
    sub: "COMMUNITY HUB",
    intel: "Join the live lobby to talk storefronts, negotiate trades, and connect with dealers in real-time.",
    tag: "COMMUNITY // LIVE_CHAT",
  },
  { 
    id: "trade", 
    image: "/banner/collectibles.jpg",
    href: "/listings", 
    title: "BROWSE", 
    highlight: "GRAILS",
    sub: "GLOBAL CATALOG",
    intel: "Scan the global archive for high-stakes hobby assets. Verified trades for serious collectors.",
    tag: "MARKETPLACE // ASSETS",
  },
  { 
    id: "bounty", 
    image: "/banner/viralbounty.jpg",
    href: "/viral-bounty", 
    title: "PLATFORM", 
    highlight: "GIVEAWAYS",
    sub: "BIG BOUNTY DROPS",
    intel: "Grow the community to score premium prize drops. Share hobbydork to earn your entry tickets.",
    tag: "REWARDS // BOUNTY",
  }
];

function HeroHUD() {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_SLIDES.length);
        setTimeout(() => setIsTransitioning(false), 700);
      }, 300);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[index];

  return (
    <div className="w-full h-[320px] md:h-[350px] relative overflow-hidden bg-zinc-950 border-b-2 border-red-600/40 group w-full px-2 md:px-4">
      <Link href={slide.href} className="block w-full h-full relative">
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 hardware-grid-overlay opacity-[0.08]" />
          <div className="absolute inset-0 animate-noise opacity-[0.08]" />
          <div className="absolute inset-0 animate-scanline opacity-30 bg-gradient-to-b from-transparent via-red-600/10 to-transparent h-20 w-full" />
          
          <div className="absolute inset-4 border border-white/5">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600/60" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-600/60" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-600/60" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600/60" />
          </div>

          {isTransitioning && (
            <div className="absolute inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 animate-glitch-tactical bg-red-600/30 mix-blend-screen" />
              <div className="absolute inset-0 animate-rgb-tactical opacity-80" />
              <div className="absolute inset-0 animate-laser bg-red-600/80 h-1 shadow-[0_0_20px_red]" />
            </div>
          )}
        </div>

        <div className="relative h-full w-full flex flex-col md:flex-row z-20 transition-all duration-500">
          <div className={cn(
            "w-full md:w-[60%] h-auto md:h-full flex flex-col justify-center px-2 sm:px-4 md:px-16 transition-all duration-500 order-2 md:order-1",
            isTransitioning ? "opacity-0 -translate-x-10 blur-xl" : "opacity-100 translate-x-0 blur-none"
          )}>
            <div className="relative shrink-0">
              <div className="text-[8px] md:text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-2 animate-pulse">
                {slide.tag}
              </div>
              <h3 className="text-white font-headline font-black italic text-2xl sm:text-3xl md:text-5xl lg:text-6xl tracking-tighter leading-none uppercase whitespace-nowrap flex items-center gap-4 animate-glitch-tactical animate-rgb-tactical">
                <span>{slide.title}</span>
                <span className="text-red-600">{slide.highlight}</span>
              </h3>
            </div>

            <div className="max-w-md w-full mt-4 md:mt-6">
              <div className="bg-zinc-950/90 backdrop-blur-2xl border-l-4 border-red-600 p-3 md:p-4 space-y-2 shadow-2xl relative ring-1 ring-white/10 overflow-hidden">
                <div className="flex items-center gap-2 relative z-10">
                  <Scan className="w-3 md:w-4 h-3 md:h-4 text-red-600 animate-pulse" />
                  <span className="text-[7px] md:text-[8px] font-black uppercase text-red-600 tracking-widest">VAULT INFORMATION</span>
                </div>
                <p className="text-white text-xs md:text-sm font-bold uppercase tracking-tight italic opacity-90 relative z-10">
                  {typeof slide.intel === 'function'
                    ? slide.intel({ navigate: (href) => window.location.assign(href) })
                    : slide.intel}
                </p>
              </div>
            </div>
          </div>

          <div className={cn(
            "w-full md:w-[40%] h-[180px] md:h-full relative transition-all duration-700 order-1 md:order-2 flex items-center justify-center md:block mt-4 md:mt-0",
            isTransitioning ? "scale-125 blur-3xl opacity-30 grayscale contrast-200" : "scale-100 blur-none opacity-100"
          )}>
            <div className="relative w-full h-full max-w-xs mx-auto md:max-w-none md:w-full md:h-full">
              <Image 
                src={slide.image} 
                alt="" 
                fill 
                className="object-cover rounded-xl md:rounded-none brightness-[0.9] md:contrast-125 grayscale-[0.1] transition-all duration-1000" 
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
              <div className="hidden md:block absolute inset-0 border-l border-white/10" />
            </div>
          </div>
        </div>

        <div className="md:absolute md:bottom-0 left-0 right-0 h-10 bg-black/95 backdrop-blur-3xl border-t border-white/10 z-30 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]" />
              <span className="text-[8px] md:text-[10px] font-black text-red-600 uppercase tracking-widest">{slide.sub}</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-6">
              <Activity className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[8px] font-mono text-white/20 tracking-tighter">HD_OS_NODE_V44.9</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-red-600 transition-colors">
            <span className="hidden xs:inline">STATUS: AUTHORIZED</span> <ChevronRight className="w-3 h-3 text-red-600 ml-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}

function ActivityTicker() {
  const db = useFirestore();
  const isoQuery = useMemoFirebase(() => db ? query(collection(db, 'iso24Posts'), orderBy('postedAt', 'desc'), limit(5)) : null, [db]);
  const { data: posts } = useCollection(isoQuery);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!posts || posts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % posts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [posts]);

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[index];

  return (
    <div className="bg-zinc-950 border-y border-white/5 py-3 overflow-hidden relative">
      <div className="container mx-auto px-4 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">LIVE ACTIVITY</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-3 animate-in slide-in-from-right duration-500">
            <Badge variant="outline" className="text-[7px] font-black border-red-600/40 text-red-600 uppercase h-5">ISO_REQUEST</Badge>
            <p className="text-[10px] md:text-xs font-bold text-white/80 truncate uppercase tracking-tight italic">
              Collector <span className="text-white">@{currentPost.userName}</span> is hunting for: <span className="text-accent underline underline-offset-4">{currentPost.title}</span>
            </p>
          </div>
        </div>
        <Link href="/iso24" className="hidden sm:flex items-center gap-1.5 text-[8px] font-black text-white/30 hover:text-accent uppercase tracking-widest transition-colors shrink-0">
          VIEW FEED <ChevronRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}

function VaultTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const CORRECT_PIN = '2323';
  const { user } = useUser();
  const db = useFirestore();

  const handleKeyClick = async (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          setStatus('success');
          // Persistent Reward Logic
          if (user && db) {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, { 
              vaultUnlocked: true,
              updatedAt: serverTimestamp() 
            }).catch(e => console.error("Vault status sync failed", e));
          }
        } else {
          setStatus('error');
          setTimeout(() => {
            setPin('');
            setStatus('idle');
          }, 1000);
        }
      }
    }
  };

  return (
    <>
      <section id="vault-section" className="container mx-auto px-4 py-6 md:py-12">
        <div 
          onClick={() => setIsOpen(true)}
          className="vault-safe-bg border-2 border-green-500/40 rounded-2xl md:rounded-[2rem] p-4 md:p-8 relative overflow-visible group cursor-pointer hover:border-green-500 transition-all shadow-[0_0_50px_rgba(34,197,94,0.1)] active:scale-[0.99]"
        >
          {/* Decorative bolts for safe look */}
          <div className="absolute inset-0 opacity-[0.05] hardware-grid-overlay" />
          <div className="absolute inset-0 binary-leak opacity-10" />
          <div className="absolute inset-0 animate-noise opacity-[0.03]" />
          <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-1/4 w-full" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
            <div className="flex items-center gap-4 md:gap-8 flex-1">
              <div className="bg-black text-green-400 p-3 md:p-5 rounded-xl md:rounded-2xl border border-green-500 unlock-green-glow transition-all group-hover:scale-110 group-hover:rotate-2 duration-500 shrink-0 text-green-400">
                <Lock className="w-6 md:w-10 h-6 md:h-10" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-4xl font-headline font-black text-white tracking-tighter uppercase leading-none italic animate-glitch-tactical">
                    OPEN <span className="text-green-500">THE VAULT</span>
                  </h2>
                  <Link href="/creed" className="hidden sm:flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded text-[7px] font-black text-green-500 uppercase tracking-widest animate-pulse hover:bg-green-500 hover:text-white transition-colors">
                    what is this
                  </Link>
                </div>
                <p className="text-zinc-500 text-[9px] md:text-xs font-bold uppercase tracking-widest italic leading-tight max-w-md">
                  Find the 4-digit PIN&mdash;it's hidden somewhere on this site. For more details,{' '}
                  <Link href="/help#vault-pin" className="underline text-accent hover:text-accent/80">see the Help Center</Link>.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-12">
              <div className="flex-1 md:flex-none">
                <p className="text-[7px] font-black text-green-500/60 uppercase tracking-[0.3em] mb-1">ENTER_PIN</p>
                <div className="bg-black border-2 border-white/5 rounded-lg h-12 md:h-14 px-6 flex items-center justify-center font-mono text-xl tracking-[0.4em] text-green-500/30 shadow-inner">
                  ****
                </div>
              </div>
              <Button className="relative bg-black text-green-400 hover:bg-zinc-900 font-black uppercase text-[10px] tracking-widest h-12 md:h-14 px-8 rounded-lg shadow-2xl transition-all group-hover:translate-x-1 overflow-hidden border border-green-500">
                {/* Green glow */}
                <span className="absolute inset-0 rounded-lg pointer-events-none animate-pulse unlock-green-glow" />
                {/* Animated green scan line */}
                <span className="absolute left-0 top-0 w-full h-1 bg-gradient-to-b from-transparent via-[#39FF14] to-transparent unlock-scanline" />
                {/* scanline keyframes and classes moved to globals.css */}
                <span className="relative z-10 flex items-center">
                  UNLOCK <ChevronRight className="w-4 h-4 ml-1 text-green-400" />
                </span>
              </Button>
            </div>
          </div>

          <div className="absolute top-2 right-2 text-[6px] font-black text-white/10 uppercase tracking-widest">MDL_V2.0_VAULT</div>
          <div className="absolute bottom-2 left-2 text-[6px] font-black text-white/10 uppercase tracking-widest">SECURE_CHANNEL_ACTIVE</div>
        </div>
      </section>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl bg-zinc-950 text-white">
          <DialogTitle className="sr-only">Vault Access Protocol</DialogTitle>
          <div className="p-10 md:p-12 space-y-10 relative">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse" />
                  <KeyRound className="w-16 h-16 text-red-600 relative z-10" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-headline font-black uppercase text-white italic tracking-tighter">Vault Access</h3>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mt-2">Enter Authority Credentials</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 relative">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-14 h-20 md:w-16 md:h-24 rounded-2xl border-4 flex items-center justify-center text-4xl font-black transition-all duration-300",
                    pin[i] ? "border-red-600 text-red-600 bg-red-600/10 shadow-[0_0_30px_rgba(220,38,38,0.4)]" : "border-zinc-800 text-zinc-800 bg-zinc-900/50",
                    status === 'error' && "border-red-500 text-red-500 bg-red-500/5 animate-shake",
                    status === 'success' && "border-green-500 text-green-500 bg-green-500/10 shadow-[0_0_50px_rgba(34,197,94,0.5)]"
                  )}
                >
                  {pin[i] ? '*' : ''}
                </div>
              ))}
            </div>

            {status === 'success' ? (
              <div className="text-center space-y-8 py-6 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(34,197,94,0.6)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-4xl font-black uppercase italic tracking-tighter">Access Granted</h4>
                  <p className="text-green-500 font-bold uppercase tracking-[0.2em] text-xs">VAULT_REWARD: LEGACY_COMMEMORATIVE_STATUS</p>
                </div>
                <Button onClick={() => setIsOpen(false)} className="w-full bg-white text-black font-black h-16 rounded-2xl text-lg uppercase tracking-widest shadow-2xl">Enter the Hub</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'C'].map((key) => (
                  <button
                    key={key}
                    onClick={() => key === 'C' ? setPin('') : key !== '' && handleKeyClick(key)}
                    className={cn(
                      "h-16 md:h-20 rounded-2xl font-black text-2xl flex items-center justify-center transition-all active:scale-95",
                      key === '' ? "invisible" : "bg-zinc-950 border-2 border-white/5 hover:bg-zinc-800 hover:border-red-600/50 hover:text-red-600 shadow-xl",
                      key === 'C' && "text-red-500 border-red-900/20"
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
              <span>HD_OS // VAULT_SYSTEM</span>
              <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> SECURE_NODE</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  
  const category = searchParams?.get('category') || 'All';
  const searchQuery = searchParams?.get('q') || '';
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [listingType, setListingType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const listingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q = query(collection(db, 'listings'), where('visibility', '==', 'Visible'), orderBy('createdAt', 'desc'), limit(100));
    if (category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    return q;
  }, [db, category]);

  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'storefronts'), where('status', '==', 'ACTIVE'), limit(12));
  }, [db]);

  const { data: listings, isLoading: listingsLoading } = useCollection<Listing>(listingsQuery as any);
  const { data: stores } = useCollection<any>(storesQuery as any);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    let result = [...listings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q)
      );
    }

    if (minPrice) {
      result = result.filter(l => (l.currentBid || l.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(l => (l.currentBid || l.price) <= parseFloat(maxPrice));
    }

    if (listingType !== 'all') {
      const typeLabel = listingType === 'auction' ? 'Auction' : 'Buy It Now';
      result = result.filter(l => l.type === typeLabel);
    }

    return result;
  }, [listings, searchQuery, minPrice, maxPrice, listingType]);

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setListingType('all');
  };

  const hasActiveFilters = minPrice || maxPrice || listingType !== 'all';

  return (
    <main className="flex-1">
      <HeroHUD />
      <ActivityTicker />

      {stores && stores.length > 0 && (
        <section className="container mx-auto px-4 py-8 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-12 md:mb-20 text-center md:text-left">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center shrink-0 border-4 border-red-600/20 shadow-2xl">
              <Users className="w-8 md:w-10 h-8 md:h-10 text-red-600" />
            </div>
            <div>
              <h2 className="text-3xl md:text-6xl font-headline font-black tracking-tighter uppercase italic leading-none">Store <span className="text-red-600">Spotlight</span></h2>
              <p className="text-[10px] md:text-xs text-muted-foreground font-black italic mt-2 uppercase tracking-[0.4em]">Paid weekly spots. To purchase, head to hobbydork store.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
            {stores.map(store => (
              <StoreSpotlight key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      <VaultTerminal />

      <section id="listings" className="container mx-auto px-4 py-8 md:py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 md:gap-8">
          <div className="space-y-2 md:space-y-3 text-left">
            <h2 className="text-2xl md:text-5xl font-headline font-black uppercase italic text-primary leading-none">
              {searchQuery ? `Searching: "${searchQuery}"` : category !== 'All' ? `${category}` : 'Latest Listings'}
            </h2>
            <p className="text-[10px] md:text-lg text-muted-foreground font-bold italic mt-1 uppercase tracking-[0.2em]">
              {listingsLoading ? 'Loading Catalog...' : `${filteredListings.length} items found.`}
            </p>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 w-full md:auto">
            <Button 
              variant="outline" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "rounded-xl md:rounded-full h-10 md:h-14 px-6 md:px-8 font-black uppercase text-[9px] md:text-[10px] tracking-widest border-2 md:border-4 gap-2 md:gap-3 flex-1 md:flex-none transition-all",
                hasActiveFilters ? "border-red-600 text-red-600 bg-red-600/5 shadow-lg" : "border-zinc-200"
              )}
            >
              <Filter className="w-4 md:w-5 h-4 md:h-5" /> Filters {hasActiveFilters && `(${[minPrice, maxPrice, listingType !== 'all'].filter(Boolean).length})`}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-red-600 font-black uppercase text-[10px] h-10 md:h-14">
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-muted/30 border-2 md:border-4 border-dashed border-zinc-200 rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 mb-8 md:mb-12 animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price Range</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-[10px]">$</span>
                    <Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="pl-8 md:pl-10 h-10 md:h-14 rounded-xl md:rounded-2xl bg-background border-none shadow-inner font-black text-sm md:text-lg" type="number" />
                  </div>
                  <span className="text-zinc-300 font-black">/</span>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-[10px]">$</span>
                    <Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="pl-8 md:pl-10 h-10 md:h-14 rounded-xl md:rounded-2xl bg-background border-none shadow-inner font-black text-sm md:text-lg" type="number" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Listing Type</Label>
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="h-10 md:h-14 rounded-xl md:rounded-2xl bg-background border-none shadow-inner font-black text-sm md:text-lg px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200">
                    <SelectItem value="all" className="font-bold">ALL TYPES</SelectItem>
                    <SelectItem value="auction" className="font-bold">AUCTIONS ONLY</SelectItem>
                    <SelectItem value="bin" className="font-bold">BUY IT NOW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sort By</Label>
                <Button variant="ghost" className="w-full h-10 md:h-14 rounded-xl md:rounded-2xl bg-background border-none shadow-inner justify-between font-black text-primary tracking-tight px-4">
                  <span className="text-sm md:text-lg">NEWEST ARRIVALS</span> <ArrowUpDown className="w-4 md:w-5 h-4 md:h-5 opacity-30" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {listingsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 gap-4 md:gap-6">
            <Loader2 className="w-12 md:w-16 h-12 md:h-16 animate-spin text-accent" />
            <p className="font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[9px] md:text-xs text-muted-foreground">Syncing Catalog...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-20 md:py-32 text-center border-4 md:border-8 border-dashed rounded-[2rem] md:rounded-[4rem] border-muted bg-muted/10 space-y-6 md:space-y-8 p-8">
            <LayoutGrid className="w-16 md:w-20 h-16 md:h-20 text-zinc-200 mx-auto" />
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <p className="font-black text-muted-foreground uppercase text-base md:text-lg tracking-widest italic">No items found.</p>
                <p className="text-xs text-muted-foreground font-bold uppercase">Can't find your grail? Post a search request and let the network find it for you.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-accent text-white hover:bg-accent/90 font-black uppercase rounded-xl h-14 px-8 shadow-xl">
                  <Link href="/iso24/create">Post ISO24 Request</Link>
                </Button>
                <Button variant="outline" onClick={clearFilters} className="rounded-xl border-2 font-black uppercase text-[10px] h-14 px-8">Clear Filters</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-6 gap-y-10 md:gap-y-24">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-red-600 w-12 h-12" /></div>}>
        <Navbar />
        <HomeContent />
      </Suspense>
    </div>
  );
}
