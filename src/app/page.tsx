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
  Lock, 
  CheckCircle2,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  X,
  Users
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Listing, FeaturedStore } from '@/lib/mock-data';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function EventSafe() {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const { user } = useUser();
  const CORRECT_PIN = '1977';

  const handleKeyClick = async (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          setStatus('success');
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
      <section className="container mx-auto px-4 py-8 md:py-20">
        <div className="bg-zinc-950 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-12 relative overflow-hidden border border-white/10 shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-50" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 md:gap-12 text-center lg:text-left">
            <div className="flex-1 space-y-4 md:space-y-6">
              <Badge className="bg-yellow-500 text-black font-black uppercase tracking-widest px-4 py-1 rounded-full text-[10px]">
                Community Event
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-headline font-black text-white tracking-tighter uppercase leading-none">
                Unlock the <span className="text-yellow-500">Box</span>
              </h2>
              <p className="text-white/60 text-sm md:text-lg font-medium max-w-xl mx-auto lg:mx-0">
                A 4-digit PIN is hidden on the platform. Find it, unlock the box, and <span className="text-white font-black">win a prize</span>.
              </p>
              <div className="pt-2">
                <Button 
                  onClick={() => setIsOpen(true)}
                  className="bg-white text-zinc-950 hover:bg-yellow-500 hover:text-black font-black h-12 md:h-16 px-10 text-lg md:text-xl rounded-xl transition-all"
                >
                  Enter Code
                </Button>
              </div>
            </div>
            <div className="relative shrink-0">
              <div 
                onClick={() => setIsOpen(true)}
                className="w-32 h-32 sm:w-40 sm:h-48 md:w-80 md:h-80 bg-zinc-900 border-4 md:border-8 border-zinc-800 rounded-full flex items-center justify-center cursor-pointer hover:border-yellow-500/50 transition-all shadow-2xl relative"
              >
                <Lock className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 md:w-24 md:h-24 text-zinc-700 transition-all duration-500",
                  status === 'success' ? "text-green-500 scale-110" : "group-hover:text-yellow-500"
                )} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-card text-foreground">
          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-headline font-black uppercase text-yellow-500">Keypad</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Enter 4-Digit PIN</p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-10 h-12 sm:w-12 sm:h-16 rounded-xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black transition-all",
                    pin[i] ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" : "border-border text-muted-foreground",
                    status === 'error' && "border-red-500 text-red-500",
                    status === 'success' && "border-green-500 text-green-500"
                  )}
                >
                  {pin[i] ? '*' : ''}
                </div>
              ))}
            </div>

            {status === 'success' ? (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-3xl font-black uppercase">Unlocked!</h4>
                  <p className="text-green-500 font-bold uppercase tracking-widest text-xs">Winner: @{user?.displayName || 'Collector'}</p>
                </div>
                <Button onClick={() => setIsOpen(false)} className="w-full bg-card text-foreground font-black h-12 rounded-xl border-2">Claim Reward</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'C'].map((key) => (
                  <button
                    key={key}
                    onClick={() => key === 'C' ? setPin('') : key !== '' && handleKeyClick(key)}
                    className={cn(
                      "h-16 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-95",
                      key === '' ? "invisible" : "bg-card border border-border hover:bg-muted",
                      key === 'C' && "text-destructive"
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
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
  const { user } = useUser();
  
  const category = searchParams?.get('category') || 'All';
  const searchQuery = searchParams?.get('q') || '';
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [listingType, setListingType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Real-time queries
  const listingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(100));
    if (category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    return q;
  }, [db, category]);

  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'storefronts'), limit(4));
  }, [db]);

  const { data: listings, isLoading: listingsLoading } = useCollection<Listing>(listingsQuery as any);
  const { data: stores } = useCollection<FeaturedStore>(storesQuery as any);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    let result = [...listings];

    result = result.filter(l => !(l as any).sellerOnVacation);

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q)
      );
    }

    // Price filters
    if (minPrice) {
      result = result.filter(l => (l.currentBid || l.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(l => (l.currentBid || l.price) <= parseFloat(maxPrice));
    }

    // Type filters
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
      <section className="relative overflow-hidden bg-[#151515] py-12 md:py-24 lg:py-32 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge variant="outline" className="text-accent border-accent px-4 py-1 mb-6 rounded-full font-black text-[10px] tracking-widest uppercase">
            The Social Marketplace
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-headline font-black text-white mb-6 leading-[0.9] max-w-5xl mx-auto uppercase tracking-tighter">
            Trade rare items with <span className="text-accent italic">community power.</span>
          </h1>
          <p className="text-sm md:text-xl text-white/80 mb-8 md:mb-12 max-w-2xl mx-auto font-medium leading-relaxed italic">
            Follow featured stores, track live shop feeds, and join the conversation. It's more than a market—it's the home for collectors.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-6 md:px-0">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black h-12 md:h-14 px-10 text-lg rounded-full shadow-lg w-full sm:w-auto">
              <Link href="#listings">Explore Items</Link>
            </Button>
            <Button size="lg" asChild className="bg-card text-foreground hover:bg-card/90 font-black h-12 md:h-14 px-10 text-lg rounded-full shadow-lg w-full sm:w-auto border-2">
              <Link href={user ? "/community-chat" : "/login"}>{user ? "Join the Chat" : "Join the Community"}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="bg-background border-b sticky top-[64px] md:top-[96px] z-40 overflow-x-auto">
        <div className="container mx-auto px-4 py-3 flex gap-4 md:gap-6 items-center whitespace-nowrap scrollbar-hide">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-r pr-6 hidden md:block">Catalog</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleCategoryClick('All')}
            className={cn(
              "font-black rounded-full px-4 md:px-6 h-9 text-xs",
              category === 'All' ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-primary"
            )}
          >
            All
          </Button>
          {CATEGORIES.map(cat => (
            <Button 
              key={cat} 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCategoryClick(cat)}
              className={cn(
                "font-black px-4 md:px-6 h-9 text-xs uppercase tracking-widest",
                category === cat ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-primary"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {stores && stores.length > 0 && (
        <section className="container mx-auto px-4 py-12 lg:py-24">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 text-center md:text-left">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-headline font-black tracking-tighter uppercase">Store Spotlight</h2>
              <p className="text-xs md:text-lg text-muted-foreground font-bold italic">Weekly paid feature spots. Available in hobbydork Store.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {stores.map(store => (
              <StoreSpotlight key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      <EventSafe />

      <section id="listings" className="container mx-auto px-4 py-12 lg:py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-headline font-black tracking-tighter uppercase">
              {searchQuery ? `Searching: "${searchQuery}"` : category !== 'All' ? `${category} Collection` : 'Live Feed'}
            </h2>
            <p className="text-xs md:text-lg text-muted-foreground font-bold italic">
              {listingsLoading ? 'Analyzing inventory...' : `${filteredListings.length} results found.`}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "rounded-full h-10 md:h-12 px-6 font-black uppercase text-[10px] tracking-widest border-2 gap-2 flex-1 md:flex-none",
                hasActiveFilters ? "border-accent text-accent bg-accent/5" : "border-zinc-200"
              )}
            >
              <Filter className="w-4 h-4" /> Filters {hasActiveFilters && `(${[minPrice, maxPrice, listingType !== 'all'].filter(Boolean).length})`}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-primary h-10">
                <X className="w-4 h-4 mr-2" /> Reset
              </Button>
            )}
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 mb-8 md:mb-12 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price Limits</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                    <Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="pl-7 h-10 md:h-12 rounded-xl bg-white border-none shadow-sm font-bold" type="number" />
                  </div>
                  <span className="text-zinc-300">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                    <Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="pl-7 h-10 md:h-12 rounded-xl bg-white border-none shadow-sm font-bold" type="number" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Listing Type</Label>
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="h-10 md:h-12 rounded-xl bg-white border-none shadow-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="auction">Auctions</SelectItem>
                    <SelectItem value="bin">Buy It Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sorting</Label>
                <Button variant="ghost" className="w-full h-10 md:h-12 rounded-xl bg-white border-none shadow-sm justify-between font-bold text-zinc-400">
                  Newest Additions <ArrowUpDown className="w-4 h-4 opacity-30" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {listingsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Loading hobbydork</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-12 md:py-20 text-center border-4 border-dashed rounded-[1.5rem] md:rounded-[2rem] border-zinc-100 bg-zinc-50/50 space-y-4">
            <LayoutGrid className="w-10 md:w-12 h-10 md:h-12 text-zinc-200 mx-auto" />
            <p className="font-bold text-muted-foreground uppercase text-xs">No active items match your criteria.</p>
            <Button variant="link" onClick={clearFilters} className="text-accent font-black uppercase text-[10px] tracking-widest">Clear All Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>}>
        <HomeContent />
      </Suspense>
      
      <footer className="bg-[#141414] text-white py-12 md:py-24 border-t border-white/5">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16 text-center md:text-left">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image 
                src="/hobbydork-main.png" 
                alt="hobbydork" 
                width={240} 
                height={50} 
                className="h-12 md:h-16 w-auto" 
              />
            </Link>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed mx-auto md:mx-0 md:ml-4 font-bold uppercase tracking-widest">
              The social marketplace.
            </p>
          </div>
          <div className="hidden md:block">
            <h4 className="font-black mb-8 text-accent uppercase tracking-widest text-[10px]">Navigation</h4>
            <ul className="text-xs space-y-4 text-white/80 font-black">
              <li><Link href="/#listings" className="hover:text-white transition-colors">Catalog</Link></li>
              <li><Link href="/iso24" className="hover:text-white transition-colors">ISO24</Link></li>
              <li><Link href="/trust-board" className="hover:text-white transition-colors">Leaderboard</Link></li>
            </ul>
          </div>
          <div className="hidden md:block">
            <h4 className="font-black mb-8 text-accent uppercase tracking-widest text-[10px]">Information</h4>
            <ul className="text-xs space-y-4 text-white/80 font-black">
              <li><Link href="/creed" className="hover:text-white transition-colors">The Creed</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>
          <div className="max-w-md mx-auto md:mx-0">
            <h4 className="font-black mb-6 md:mb-8 text-accent uppercase tracking-widest text-[10px]">Platform</h4>
            <p className="text-[10px] text-white/60 mb-6 font-bold uppercase tracking-widest">Protocol Environment Live.</p>
            <Button variant="outline" className="text-zinc-900 dark:text-white border-white/20 w-full font-black uppercase text-[10px] tracking-widest h-12 rounded-xl">Network Status: Online</Button>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 md:mt-20 pt-10 border-t border-white/10 text-center text-[9px] text-white/20 uppercase font-black tracking-widest">
          &copy; {new Date().getFullYear()} hobbydork. Built for Collectors.
        </div>
      </footer>
    </div>
  );
}
