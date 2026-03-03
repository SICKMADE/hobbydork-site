'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search as SearchIcon,
  Loader2,
  X,
  Tag,
  Gavel,
  ShoppingBag,
  ListFilter,
  CheckCircle2,
  History,
  LayoutGrid,
  Sliders as SliderIcon,
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy as firestoreOrderBy, where, limit } from 'firebase/firestore';
import type { Listing } from '@/lib/mock-data';
import { CATEGORIES, isListingExpired } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  
  // URL Params
  const initialCategory = searchParams?.get('category') || 'All';
  const initialQuery = searchParams?.get('q') || '';
  
  // Local State
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [minPrice, setMinPrice] = useState(searchParams?.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams?.get('max') || '');
  const [listingType, setListingType] = useState(searchParams?.get('type') || 'all');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'newest');
  const [showSold, setShowSold] = useState(searchParams?.get('sold') === 'true');

  // Sync local search input with URL when URL changes externally
  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  // Firestore Query
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

    result = result.filter(l => !(l as any).sellerOnVacation);

    // Status filter
    if (!showSold) {
      result = result.filter(l => l.status !== 'Sold' && !isListingExpired(l));
    }

    // Search filter
    if (initialQuery) {
      const q = initialQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) ||
        l.tags?.some((t: string) => t.toLowerCase().includes(q))
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

    // Sorting
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
  }, [listings, initialQuery, minPrice, maxPrice, listingType, sortBy, showSold]);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    Object.entries(updates).forEach(([key, val]) => {
      if (val === '' || val === 'all' || (key === 'category' && val === 'All') || (key === 'sold' && val === 'false')) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`/listings?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const clearFilters = () => {
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    setListingType('all');
    setSortBy('newest');
    setShowSold(false);
    router.push('/listings');
  };

  const FilterSection = () => (
    <div className="space-y-10">

      {/* Transaction Type Section */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <Gavel className="w-3 h-3" /> Format
        </h4>
        <div className="space-y-2">
          {[
            { id: 'all', label: 'All Formats', icon: LayoutGrid },
            { id: 'auction', label: 'Auctions', icon: Gavel },
            { id: 'bin', label: 'Buy It Now', icon: ShoppingBag },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setListingType(type.id);
                updateFilters({ type: type.id });
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                listingType === type.id ? "bg-zinc-950 border-zinc-950 text-white shadow-xl" : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200"
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                <type.icon className={cn("w-4 h-4", listingType === type.id ? "text-accent" : "text-zinc-300")} />
                {type.label}
              </span>
              {listingType === type.id && <CheckCircle2 className="w-4 h-4 text-accent" />}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Limits Section */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <SliderIcon className="w-3 h-3" /> Budget
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs">$</span>
            <Input 
              placeholder="Min" 
              value={minPrice} 
              onChange={(e) => {
                setMinPrice(e.target.value);
                updateFilters({ min: e.target.value });
              }}
              className="pl-8 h-12 rounded-xl bg-white border-2 border-zinc-100 font-bold text-sm focus-visible:ring-accent" 
              type="number" 
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs">$</span>
            <Input 
              placeholder="Max" 
              value={maxPrice} 
              onChange={(e) => {
                setMaxPrice(e.target.value);
                updateFilters({ max: e.target.value });
              }}
              className="pl-8 h-12 rounded-xl bg-white border-2 border-zinc-100 font-bold text-sm focus-visible:ring-accent" 
              type="number" 
            />
          </div>
        </div>
      </div>

      {/* Availability Section */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <History className="w-3 h-3" /> Availability
        </h4>
        <div 
          onClick={() => {
            const newVal = !showSold;
            setShowSold(newVal);
            updateFilters({ sold: newVal ? 'true' : 'false' });
          }}
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group",
            showSold ? "bg-accent/5 border-accent shadow-lg" : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-500"
          )}
        >
          <div className="space-y-0.5">
            <Label className="text-xs font-black uppercase tracking-widest cursor-pointer group-hover:text-primary transition-colors text-zinc-500 dark:text-zinc-300">Include Sold</Label>
            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Historical Records</p>
          </div>
          <Checkbox 
            checked={showSold} 
            className={cn("h-5 w-5 rounded-lg border-2", showSold && "bg-accent border-accent")}
          />
        </div>
      </div>

      {/* Specialty Niche Section */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <Tag className="w-3 h-3" /> Specialization
        </h4>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => updateFilters({ category: 'All' })}
            className={cn(
              "text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              initialCategory === 'All' ? "bg-primary text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 bg-white dark:bg-zinc-800 border dark:border-zinc-700"
            )}
          >
            All Archives
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => updateFilters({ category: cat })}
              className={cn(
                "text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                initialCategory === cat ? "bg-primary text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Button 
        variant="ghost" 
        onClick={clearFilters}
        className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-red-600 h-12 border-2 border-dashed border-zinc-100 hover:border-red-100 transition-all rounded-2xl"
      >
        <X className="w-3 h-3 mr-2" /> Reset Profile
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Discovery Hero Section */}
        <section className="relative overflow-hidden !bg-[#2e2e2e] py-6 md:py-10 text-white rounded-[2rem] mb-12 animate-in fade-in zoom-in duration-700">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />
          <div className="container mx-auto px-8 relative z-10">
            <Badge variant="outline" className="text-accent border-accent px-4 py-1 mb-6 rounded-full font-black text-[10px] tracking-widest uppercase">
              Global Catalog Scan
            </Badge>
            <h1 className="text-4xl md:text-7xl font-headline font-black text-white mb-8 leading-[0.9] uppercase tracking-tighter">
              The <span className="text-accent italic">Archive.</span>
            </h1>
            <div className="max-w-3xl">
              <form onSubmit={handleSearchSubmit} className="relative group flex justify-center">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6 z-10" />
                <Input 
                  placeholder="Search for keywords, dealers, or items..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-20 rounded-full border-4 border-red-500 !bg-white text-zinc-900 placeholder:text-zinc-500 shadow-2xl pl-16 text-xl md:text-2xl font-bold italic focus-visible:ring-4 focus-visible:ring-red-500 focus-visible:ring-offset-0 transition-all"
                />
                <button 
                  type="submit"
                  aria-label="Search listings"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_0_0_#991b1b] hover:bg-red-700 active:translate-y-1 transition-all focus:outline-none focus:ring-4 focus:ring-red-300"
                >
                  <SearchIcon className="w-6 h-6 drop-shadow-[0_2px_0_#991b1b]" />
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 border-b border-dashed pb-8">
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium text-lg italic border-l-4 border-accent pl-6 py-1">
              {isLoading ? 'Decrypting inventory...' : `${filteredListings.length} records identified.`}
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sort Sequence</Label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); updateFilters({ sort: v }); }}>
                <SelectTrigger className="w-[240px] h-14 rounded-full border-2 bg-white text-zinc-950 font-black uppercase text-[10px] tracking-widest shadow-lg">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="newest" className="text-[10px] font-black uppercase py-3">Newest First</SelectItem>
                  <SelectItem value="price_asc" className="text-[10px] font-black uppercase py-3">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc" className="text-[10px] font-black uppercase py-3">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-14 w-14 rounded-full border-2 shadow-lg p-0">
                  <ListFilter className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[450px] overflow-y-auto p-8 border-l-[8px] border-zinc-950">
                <SheetHeader className="mb-12 text-left">
                  <SheetTitle className="text-4xl font-headline font-black uppercase italic tracking-tighter">Filters</SheetTitle>
                  <SheetDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Adjust scan parameters</SheetDescription>
                </SheetHeader>
                <FilterSection />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-16">
          <aside className="hidden lg:block space-y-12 sticky top-32 h-fit animate-in fade-in slide-in-from-left duration-700">
            <FilterSection />
          </aside>

          <div className="space-y-12">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="w-20 h-20 animate-spin text-accent" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground ml-4">Accessing Vault Records</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="py-40 text-center border-[6px] border-dashed border-zinc-100 rounded-[4rem] space-y-8 bg-zinc-50/30">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl border-2">
                  <SearchIcon className="w-10 h-10 text-zinc-950 opacity-20" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-headline font-black uppercase tracking-tight">Zero Records Located</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto italic text-lg leading-relaxed px-6">
                    "The specific item or variant you are hunting for is not currently indexed in our live feed."
                  </p>
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button onClick={clearFilters} variant="outline" className="rounded-full font-black uppercase text-[10px] tracking-widest px-10 h-14 border-2">Clear Search</Button>
                  <Button asChild className="rounded-full font-black uppercase text-[10px] tracking-widest px-10 h-14 bg-accent text-white shadow-xl">
                    <Link href="/iso24/create">Post ISO Request</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest">Opening Archive</p>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
