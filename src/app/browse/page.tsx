"use client";
import { CATEGORIES, isListingExpired } from '@/lib/mock-data';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search as SearchIcon,
  Loader2,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ShieldCheck,
  X
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Listing, Category } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  
  const initialCategory = (searchParams?.get('category') as Category | 'All') || 'All';
  const initialQuery = searchParams?.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [listingType, setListingType] = useState(searchParams?.get('type') || 'all');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'newest');
  const [showSold, setShowSold] = useState(searchParams?.get('sold') === 'true');
  const [condition, setCondition] = useState(searchParams?.get('condition') || 'all');
  
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams?.get('minPrice') || '0'),
    parseInt(searchParams?.get('maxPrice') || '50000')
  ]);

  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  const listingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q = query(collection(db, 'listings'), where('visibility', '==', 'Visible'), limit(150));
    if (initialCategory !== 'All') {
      q = query(q, where('category', '==', initialCategory));
    }
    return q;
  }, [db, initialCategory]);

  const { data: listings, isLoading } = useCollection(listingsQuery);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    let result = [...listings] as Listing[];

    result = result.filter(l => !isListingExpired(l));

    if (!showSold) {
      result = result.filter(l => l.status !== 'Sold');
    }

    if (initialQuery) {
      const q = initialQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) ||
        l.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    if (listingType !== 'all') {
      const typeLabel = listingType === 'auction' ? 'Auction' : 'Buy It Now';
      result = result.filter(l => l.type === typeLabel);
    }

    result = result.filter(l => {
      const p = l.currentBid || l.price;
      return p >= priceRange[0] && p <= priceRange[1];
    });

    if (condition !== 'all') {
      const condQ = condition.toLowerCase();
      result = result.filter(l => 
        l.description.toLowerCase().includes(condQ) || 
        l.title.toLowerCase().includes(condQ)
      );
    }

    result.sort((a, b) => {
      const priceA = a.currentBid || a.price;
      const priceB = b.currentBid || b.price;
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return dateB - dateA;
    });

    return result;
  }, [listings, initialQuery, listingType, sortBy, showSold, priceRange, condition]);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    Object.entries(updates).forEach(([key, val]) => {
      if (val === '' || val === 'all' || (key === 'category' && val === 'All') || (key === 'sold' && val === 'false')) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`/browse?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString() });
  };

  const clearFilters = () => {
    setSearchInput('');
    setListingType('all');
    setSortBy('newest');
    setShowSold(false);
    setPriceRange([0, 50000]);
    setCondition('all');
    router.push('/browse');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <header className="py-0">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-[#333333] rounded-b-2xl p-6 md:p-10 shadow-2xl text-white space-y-6">
            <div className="text-center">
              <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tighter uppercase leading-[0.9] text-white">
                Scan the <span className="text-accent italic">Grails.</span>
              </h1>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="relative group flex-1">
                  <Input 
                    placeholder="Search grails..." 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="h-10 md:h-11 rounded-xl border-2 border-accent bg-white font-black text-sm md:text-base focus-visible:ring-accent focus-visible:border-accent transition-all placeholder:text-zinc-400 text-black shadow-none"
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-10 md:h-11 w-10 md:w-11 rounded-xl bg-accent text-white hover:bg-white hover:text-black transition-all p-0 flex items-center justify-center shrink-0 shadow-lg active:scale-95 border-2 border-accent"
                >
                  <SearchIcon className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">0</div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    Budget
                  </div>
                  <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">50,000+</div>
                </div>
                <div className="px-2">
                  <Slider 
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={50000}
                    step={100}
                    minStepsBetweenThumbs={1}
                  />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest flex justify-center gap-2">
                  <span className="text-green-500 font-bold">${priceRange[0].toLocaleString()}</span>
                  <span className="text-white/20">—</span>
                  <span className="text-red-600 font-bold">${priceRange[1] >= 50000 ? '50,000+' : priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </header>

      <div className="sticky top-[64px] md:top-[96px] z-40 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {['All', ...CATEGORIES].map(cat => (
              <button 
                key={cat}
                onClick={() => updateFilters({ category: cat })}
                className={cn(
                  "px-5 h-8 rounded-full text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border shrink-0",
                  initialCategory === cat ? "bg-accent border-accent text-white" : "bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-background"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "h-9 px-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all gap-2 shadow-none bg-transparent",
                  isFilterOpen ? "border-accent text-accent" : "border-foreground text-foreground"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                Parameters
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isFilterOpen && "rotate-180")} />
              </Button>

              <Select value={sortBy} onValueChange={(v) => updateFilters({ sort: v })}>
                <SelectTrigger className="h-9 w-36 rounded-xl border-2 border-foreground bg-transparent text-[9px] font-black uppercase tracking-widest px-3 shadow-none text-foreground">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-foreground" />
                    <SelectValue placeholder="Sort" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-[9px] font-black uppercase text-foreground">Newest</SelectItem>
                  <SelectItem value="price_asc" className="text-[9px] font-black uppercase text-foreground">Lo to Hi</SelectItem>
                  <SelectItem value="price_desc" className="text-[9px] font-black uppercase text-foreground">Hi to Lo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:flex items-center gap-3 bg-transparent px-3 py-1 rounded-xl border border-foreground">
              <span className="text-[9px] font-black uppercase text-foreground tracking-widest">View Sold</span>
              <button 
                onClick={() => updateFilters({ sold: showSold ? 'false' : 'true' })}
                className={cn(
                  "w-8 h-4 rounded-full relative transition-all duration-300",
                  showSold ? "bg-accent" : "bg-zinc-300"
                )}
                aria-label={showSold ? "Hide sold" : "Show sold"}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                  showSold ? "left-[1rem]" : "left-0.5"
                )} />
              </button>
            </div>
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-transparent border-t animate-in slide-in-from-top-2 duration-300">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-foreground ml-1">Asset Format</Label>
                  <Select value={listingType} onValueChange={setListingType}>
                    <SelectTrigger className="h-9 rounded-xl border-2 border-foreground bg-transparent font-black text-xs shadow-none text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-foreground">Global (All)</SelectItem>
                      <SelectItem value="auction" className="text-foreground">Auctions Only</SelectItem>
                      <SelectItem value="bin" className="text-foreground">Buy It Now Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-foreground ml-1">Condition Tier</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="h-9 rounded-xl border-2 border-foreground bg-transparent font-black text-xs shadow-none text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-foreground">Any Condition</SelectItem>
                      <SelectItem value="mint" className="text-foreground">Mint / Gem Mint</SelectItem>
                      <SelectItem value="near mint" className="text-foreground">Near Mint (NM)</SelectItem>
                      <SelectItem value="excellent" className="text-foreground">Excellent (EX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-foreground/10 flex items-center justify-between">
                <Button 
                  onClick={() => updateFilters({ 
                    type: listingType,
                    condition,
                    minPrice: priceRange[0].toString(),
                    maxPrice: priceRange[1].toString(),
                    sold: showSold.toString()
                  })}
                  className="bg-primary text-primary-foreground h-9 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-none"
                >
                  Apply Protocols
                </Button>
                <Button variant="ghost" onClick={clearFilters} className="h-9 text-[9px] font-black uppercase tracking-widest text-foreground hover:text-red-600">
                  Purge Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-muted">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground">
              {isLoading ? 'Scanning Archive Records...' : `${filteredListings.length} assets localized`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-foreground tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Secure Node
          </div>
        </div>

        <div className="min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Syncing Catalog...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-24 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-foreground space-y-6 text-foreground">
              <div className="w-16 h-16 bg-card rounded-3xl flex items-center justify-center mx-auto border-2 border-foreground shadow-sm">
                <SearchIcon className="w-8 h-8 text-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-black uppercase tracking-tight text-foreground">No Assets Located</h3>
                <p className="text-foreground text-xs font-black italic max-sm mx-auto">Adjust your parameters to find your next grail.</p>
              </div>
              <Button onClick={clearFilters} variant="outline" className="rounded-xl border-2 border-foreground font-black uppercase text-[10px] tracking-widest px-8 h-11 text-foreground">Reset discovery</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin text-accent" /></div>}>
      <BrowseContent />
    </Suspense>
  );
}
