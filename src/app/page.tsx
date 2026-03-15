
'use client';

import { useMemo, Suspense, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import StoreSpotlight from '@/components/StoreSpotlight';
import { CATEGORIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Loader2, 
  MessageSquare, 
  Zap, 
  ArrowRight, 
  Clock, 
  Heart,
  Store as StoreIcon,
  LayoutGrid,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Radio,
  Rss,
  Crown,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, collectionGroup, doc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn, getRandomAvatar } from '@/lib/utils';
import type { Listing } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AD_FEATURES = [
  { id: "feed", image: "/feed.jpg", href: "/listings" },
  { id: "drop", image: "/drop.jpg", href: "/listings" },
  { id: "iso24", image: "/iso24.jpg", href: "/iso24" },
  { id: "give", image: "/give.jpg", href: "/listings" },
  { id: "live", image: "/live.jpg", href: "/listings?type=auction" }
];

function FeatureCarousel() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % AD_FEATURES.length);
        setIsVisible(true);
      }, 500);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const feature = AD_FEATURES[index];

  return (
    <div className="w-full flex items-center justify-center py-2 md:py-8">
      <Link 
        href={feature.href}
        className={cn(
          "w-full max-w-6xl transition-all duration-700 ease-in-out transform relative z-10 rounded-xl md:rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden cursor-pointer group hover:opacity-95",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        <div className="relative aspect-[21/9] md:aspect-[4/1] w-full">
          <Image 
            src={feature.image} 
            alt="Feature Advertisement" 
            fill
            className="object-cover md:object-contain bg-zinc-900"
            priority
          />
        </div>
      </Link>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const category = searchParams?.get('category') || 'All';
  const searchQuery = searchParams?.get('q') || '';
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [listingType, setListingType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);
  const isStaff = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR';

  // Vetted Spotlight Query - TOP POSITION
  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'storefronts'), 
      where('status', '==', 'ACTIVE'),
      orderBy('isSpotlighted', 'desc'),
      orderBy('totalSales', 'desc'),
      limit(4)
    );
  }, [db]);

  // Marketplace Feed Query - THE LIVE FEED
  const listingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q = query(collection(db, 'listings'), where('visibility', '==', 'Visible'), orderBy('createdAt', 'desc'), limit(48));
    if (category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    return q;
  }, [db, category]);

  // Social Feed Query (The global Community Pulse)
  const socialPostsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collectionGroup(db, 'posts'), orderBy('timestamp', 'desc'), limit(6));
  }, [db]);

  const { data: listings, isLoading: listingsLoading } = useCollection<Listing>(listingsQuery as any);
  const { data: stores, isLoading: storesLoading } = useCollection<any>(storesQuery as any);
  const { data: socialPosts } = useCollection(socialPostsQuery);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    let result = [...listings];

    result = result.filter(l => !(l as any).sellerOnVacation);

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

  const handleCategoryClick = (cat: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setListingType('all');
  };

  const hasActiveFilters = minPrice || maxPrice || listingType !== 'all';

  return (
    <main className="flex-1">
      {/* 1. HERO & FEATURE CAROUSEL */}
      <section className="relative overflow-hidden bg-[#151515] py-4 md:py-12 lg:py-16 text-white border-b border-white/5">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <FeatureCarousel />
          <div className="flex flex-col sm:flex-row justify-center gap-3 px-2 md:px-0 mt-6 md:mt-8">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-12 md:h-14 px-10 text-base md:text-lg rounded-full shadow-lg w-full sm:w-auto">
              <Link href="#listings">Scan Marketplace</Link>
            </Button>
            <Button size="lg" asChild className="bg-white/10 text-white hover:bg-white/20 font-black h-12 md:h-14 px-10 text-base md:text-lg rounded-full shadow-lg w-full sm:w-auto border-2 border-white/20 backdrop-blur-md">
              <Link href={user ? "/community-chat" : "/login"}>{user ? "Join Live Lobby" : "Join Community"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. STORE SPOTLIGHT (PRIMARY POSITION) */}
      <section className="bg-zinc-50 border-b py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 mb-8 md:mb-12 text-center md:text-left">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-accent/20">
              <Crown className="w-5 h-5 md:w-8 md:h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl md:text-4xl lg:text-5xl font-headline font-black tracking-tighter uppercase text-foreground">Verified Spotlights</h2>
              <p className="text-[10px] md:text-lg text-muted-foreground font-bold italic">Top-Tier Dealers • Certified Performance</p>
            </div>
          </div>
          
          {storesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : stores && stores.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              {stores.map(store => (
                <StoreSpotlight key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-zinc-200 p-12 text-center">
              <StoreIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="font-black uppercase text-sm text-zinc-400">No active spotlights in queue</p>
              {isStaff && (
                <Button asChild variant="outline" className="mt-4 rounded-xl border-accent text-accent font-black uppercase text-[10px]">
                  <Link href="/admin">Grant Manual Spotlight</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. THE LIVE FEED (MARKETPLACE TICKER) */}
      <div id="listings" className="bg-background border-b sticky top-[64px] md:top-[96px] z-40 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex gap-3 md:gap-6 items-center overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 shrink-0 border-r pr-4 hidden md:flex">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">LIVE FEED</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleCategoryClick('All')}
            className={cn(
              "font-black rounded-full px-4 md:px-6 h-8 md:h-9 text-[10px] md:text-xs shrink-0",
              category === 'All' ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-primary"
            )}
          >
            All Assets
          </Button>
          {CATEGORIES.map(cat => (
            <Button 
              key={cat} 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCategoryClick(cat)}
              className={cn(
                "font-black px-4 md:px-6 h-8 md:h-9 text-[10px] md:text-xs uppercase tracking-widest shrink-0",
                category === cat ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-primary"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <section className="container mx-auto px-4 py-8 md:py-20 bg-background">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">Discovery Engine</span>
            </div>
            <h2 className="text-xl md:text-4xl lg:text-5xl font-headline font-black tracking-tighter uppercase text-foreground italic leading-none">
              Live <span className="text-accent">Marketplace</span>
            </h2>
            <p className="text-[9px] md:text-sm font-black uppercase tracking-widest text-foreground opacity-60">
              {listingsLoading ? 'Analyzing inventory...' : `${filteredListings.length} assets hitting the floor`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "rounded-lg md:rounded-xl h-10 md:h-12 px-4 md:px-6 font-black uppercase text-[9px] md:text-[10px] tracking-widest border-2 gap-2 flex-1 md:flex-none shadow-none bg-transparent",
                hasActiveFilters ? "border-accent text-accent" : "border-foreground text-foreground"
              )}
            >
              <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" /> Parameters {hasActiveFilters && `(${[minPrice, maxPrice, listingType !== 'all'].filter(Boolean).length})`}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-foreground hover:text-red-600 font-black uppercase text-[9px] md:text-[10px] tracking-widest h-10">
                <X className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-transparent border-2 border-dashed border-foreground/10 rounded-xl md:rounded-[2rem] p-4 md:p-8 mb-6 md:mb-12 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-foreground">Budget Constraints</Label>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 text-[10px]">$</span>
                    <Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="pl-7 h-10 md:h-12 rounded-lg md:rounded-xl bg-transparent border-2 border-foreground/10 shadow-none font-bold text-foreground text-xs md:text-sm" type="number" />
                  </div>
                  <span className="text-foreground/20">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 text-[10px]">$</span>
                    <Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="pl-7 h-10 md:h-12 rounded-lg md:rounded-xl bg-transparent border-2 border-foreground/10 shadow-none font-bold text-foreground text-xs md:text-sm" type="number" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-foreground">Asset Format</Label>
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="h-10 md:h-12 rounded-lg md:rounded-xl bg-transparent border-2 border-foreground/10 shadow-none font-black text-[10px] md:text-xs text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global (All)</SelectItem>
                    <SelectItem value="auction">Auctions Only</SelectItem>
                    <SelectItem value="bin">Buy It Now Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-foreground">Ordering</Label>
                <Button variant="ghost" className="w-full h-10 md:h-12 rounded-lg md:rounded-xl bg-white/5 border-2 border-foreground/10 shadow-none justify-between font-black uppercase text-[10px] tracking-widest text-foreground">
                  Newest Additions <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {listingsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-accent" />
            <p className="font-black uppercase tracking-widest text-[9px] md:text-[10px] text-foreground">Syncing Catalog</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-12 md:py-20 text-center border-4 border-dashed rounded-xl md:rounded-[2rem] border-foreground/5 bg-muted/20 space-y-4">
            <LayoutGrid className="w-8 h-8 md:w-12 md:h-12 text-foreground mx-auto opacity-10" />
            <p className="font-black text-foreground uppercase text-[10px] md:text-xs">No active assets located.</p>
            <Button variant="link" onClick={clearFilters} className="text-accent font-black uppercase text-[9px] md:text-[10px] tracking-widest">Purge Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-24 md:gap-x-4 md:gap-y-32">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* 4. COMMUNITY PULSE (SOCIAL BROADCASTS) */}
      {socialPosts && socialPosts.length > 0 && (
        <section className="bg-zinc-950 text-white py-16 md:py-24 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 mb-8 md:mb-12 text-center md:text-left">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                <Rss className="w-5 h-5 md:w-8 md:h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-xl md:text-4xl lg:text-5xl font-headline font-black tracking-tighter uppercase text-white">Community Pulse</h2>
                <p className="text-[10px] md:text-lg text-white/40 font-bold italic">The Live Social Feed • Dealer Broadcasts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {socialPosts.map(post => (
                <Card key={post.id} className="p-5 md:p-6 border-none shadow-md rounded-[1.5rem] bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-10 h-10 border-2 border-white/10">
                      <AvatarImage src={post.authorAvatar || getRandomAvatar(post.authorId)} />
                      <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-black text-xs md:text-sm truncate uppercase tracking-tight text-white">@{post.authorName}</p>
                      <p className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {post.timestamp?.toDate ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed line-clamp-3 mb-4 italic">"{post.content}"</p>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <Button asChild variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase hover:bg-accent hover:text-white text-white/60">
                      <Link href={`/shop/${post.authorName}`}>Visit Shop</Link>
                    </Button>
                    <div className="flex items-center gap-3">
                      <button className="text-white/20 hover:text-accent transition-colors" title="Like"><Heart className="w-4 h-4" /></button>
                      <button className="text-white/20 hover:text-primary transition-colors" title="Message"><MessageSquare className="w-4 h-4" /></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
