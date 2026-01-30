"use client";
import { useEffect, useState } from "react";
import type { Listing } from '@/lib/types';
import { db } from "@/firebase/client-provider";
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import Spinner from "@/components/ui/spinner";
import ListingCard from "@/components/ListingCard";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from 'react-responsive';

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [previewListing, setPreviewListing] = useState<Listing|null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categoryOptions = [
    { value: "", label: "All Categories", icon: "🌐" },
    { value: "COMIC_BOOKS", label: "Comic Books", icon: "📚" },
    { value: "SPORTS_CARDS", label: "Sports Cards", icon: "🏅" },
    { value: "POKEMON_CARDS", label: "Pokémon Cards", icon: "⚡" },
    { value: "VIDEO_GAMES", label: "Video Games", icon: "🎮" },
    { value: "TOYS", label: "Toys", icon: "🧸" },
    { value: "OTHER", label: "Other", icon: "✨" },
  ];

  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("1000");

  // Keep priceRange in sync with minPrice/maxPrice for mobile filters
  useEffect(() => {
    setMinPrice(String(priceRange[0]));
    setMaxPrice(String(priceRange[1]));
  }, [priceRange]);
  const [sortBy, setSortBy] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const PAGE_SIZE = 20;

  async function loadListings(reset = false) {
    if (!db) {
      setLoading(false);
      return;
    }
    if (reset) {
      setListings([]);
      setLastDoc(null);
      setHasMore(true);
    }
    setLoading(true);
    let qBase = query(collection(db, "listings"), where("state", "==", "ACTIVE"));
    // sort
    if (sortBy === "newest") {
      qBase = query(qBase, orderBy("createdAt", "desc"));
    } else if (sortBy === "oldest") {
      qBase = query(qBase, orderBy("createdAt", "asc"));
    } else if (sortBy === "low") {
      qBase = query(qBase, orderBy("price", "asc"));
    } else if (sortBy === "high") {
      qBase = query(qBase, orderBy("price", "desc"));
    } else if (sortBy === "alpha") {
      // Firestore does not support orderBy on computed fields, so sort client-side
      // We'll fetch by createdAt desc, then sort client-side
      qBase = query(qBase, orderBy("createdAt", "desc"));
    } else if (sortBy === "popular") {
      // Firestore does not support orderBy on computed fields, so sort client-side
      // We'll fetch by createdAt desc, then sort client-side
      qBase = query(qBase, orderBy("createdAt", "desc"));
    }
    if (lastDoc && !reset) {
      qBase = query(qBase, startAfter(lastDoc));
    }
    qBase = query(qBase, limit(PAGE_SIZE));
    const snap = await getDocs(qBase);
    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Listing[];
    // search
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter((l) => l.title.toLowerCase().includes(s));
    }
    // category
    if (category.trim() !== "") {
      data = data.filter((l) => l.category === category);
    }
    // price min/max
    const min = priceRange[0];
    const max = priceRange[1];
    data = data.filter((l) => l.price >= min && l.price <= max);
    // Client-side sort for alpha and popular
    let sortedData = data;
    if (sortBy === "alpha") {
      sortedData = [...data].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === "popular") {
      sortedData = [...data].sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === "oldest") {
      sortedData = [...data].sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
        const aTime = aDate instanceof Date ? aDate.getTime() : Number(aDate);
        const bTime = bDate instanceof Date ? bDate.getTime() : Number(bDate);
        return aTime - bTime;
      });
    } else if (sortBy === "newest") {
      sortedData = [...data].sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
        const aTime = aDate instanceof Date ? aDate.getTime() : Number(aDate);
        const bTime = bDate instanceof Date ? bDate.getTime() : Number(bDate);
        return bTime - aTime;
      });
    }
    if (reset) {
      setListings(sortedData);
    } else {
      setListings((prev) => [...prev, ...sortedData]);
    }
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }

  // Load more on scroll
  useEffect(() => {
    function handleScroll() {
      if (!hasMore || loadingMore || loading) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setLoadingMore(true);
        loadListings();
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loading, lastDoc, sortBy, search, category, priceRange]);

  // Reset listings on filter/sort change
  useEffect(() => {
    loadListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, search, category, priceRange]);

  // Initial load
  useEffect(() => {
    loadListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout sidebarComponent={<SellerSidebar />}> 
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Marketplace</h1>
            <p className="text-sm text-muted-foreground">Browse, filter, and discover collectibles for sale.</p>
          </div>
          <Button onClick={() => loadListings()} size="sm" className="comic-button">Apply Filters</Button>
        </div>

        {/* FILTERS */}
        {isMobile ? (
          <>
            <Button className="w-full mb-2 font-bold bg-gradient-to-r from-primary/80 to-secondary/80 text-white shadow-lg border-2 border-black" variant="outline" onClick={() => setShowMobileFilters(true)} aria-label="Show Filters">
              <span role="img" aria-label="Filter">🔎</span> Show Filters
            </Button>
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Filter options">
                <div className="bg-white rounded-2xl p-6 w-[95vw] max-w-md border-2 border-black shadow-2xl relative animate-fade-in-slow">
                  <button className="absolute top-2 right-2 text-lg font-bold hover:text-primary transition" onClick={() => setShowMobileFilters(false)} aria-label="Close Filters">×</button>
                  <div className="flex flex-col gap-4">
                    <Input
                      placeholder="Search title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="comic-input-field border-2 border-black focus:ring-2 focus:ring-primary"
                    />
                    <select
                      id="category-mobile"
                      className="h-10 w-full rounded-md border-2 border-black bg-muted/40 px-3 text-sm font-semibold"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      aria-label="Category"
                    >
                      {categoryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min Price"
                        value={minPrice}
                        onChange={(e) => {
                          setMinPrice(e.target.value);
                          const min = Math.max(0, Number(e.target.value) || 0);
                          setPriceRange([min, Math.max(min, Number(maxPrice) || 1000)]);
                        }}
                        type="number"
                        className="comic-input-field border-2 border-black focus:ring-2 focus:ring-primary"
                      />
                      <Input
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={(e) => {
                          setMaxPrice(e.target.value);
                          const max = Math.max(Number(minPrice) || 0, Number(e.target.value) || 1000);
                          setPriceRange([Math.min(Number(minPrice) || 0, max), max]);
                        }}
                        type="number"
                        className="comic-input-field border-2 border-black focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <label htmlFor="sortBy" className="sr-only">Sort by</label>
                    <select
                      id="sortBy"
                      className="h-10 w-full rounded-md border-2 border-black bg-muted/40 px-3 text-sm font-semibold"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort by"
                    >
                      <option value="newest">🆕 Newest</option>
                      <option value="oldest">📅 Oldest</option>
                      <option value="alpha">🔤 A–Z</option>
                      <option value="popular">🔥 Most Popular</option>
                      <option value="low">⬇️ Price: Low → High</option>
                      <option value="high">⬆️ Price: High → Low</option>
                    </select>
                    <Button className="w-full mt-2 font-bold bg-gradient-to-r from-primary to-secondary text-white border-2 border-black shadow" onClick={() => { setShowMobileFilters(false); loadListings(); }}>Apply Filters</Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="sticky top-2 z-30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 p-5 rounded-2xl border-2 border-black shadow-xl backdrop-blur-md">
            <Input
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="comic-input-field border-2 border-black focus:ring-2 focus:ring-primary bg-white/80"
            />
            <select
              id="category"
              className="h-10 w-full rounded-md border-2 border-black bg-muted/40 px-3 text-sm font-semibold"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
              ))}
            </select>
            <div className="flex flex-col gap-1 col-span-2">
              <label htmlFor="priceRange" className="text-xs font-semibold mb-1">Price Range</label>
              <Slider
                min={0}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={setPriceRange}
                aria-label="Price Range"
                className="bg-white/80 border-2 border-black rounded-lg"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
            <label htmlFor="sortBy" className="sr-only">Sort by</label>
            <select
              id="sortBy"
              className="h-10 w-full rounded-md border-2 border-black bg-muted/40 px-3 text-sm font-semibold"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort by"
            >
              <option value="newest">🆕 Newest</option>
              <option value="oldest">📅 Oldest</option>
              <option value="alpha">🔤 A–Z</option>
              <option value="popular">🔥 Most Popular</option>
              <option value="low">⬇️ Price: Low → High</option>
              <option value="high">⬆️ Price: High → Low</option>
            </select>
          </div>
        )}

        {/* FILTER CHIPS */}
        <div className="flex flex-wrap gap-2 mb-2" role="region" aria-label="Active filters">
          {search && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 cursor-pointer" onClick={() => setSearch("")}>Search: {search} <span className="ml-1">×</span></Badge>
          )}
          {category && (
            <Badge className="bg-green-100 text-green-800 border-green-300 cursor-pointer" onClick={() => setCategory("")}>Category: {categoryOptions.find(opt => opt.value === category)?.label || category} <span className="ml-1">×</span></Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 1000) && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 cursor-pointer" onClick={() => setPriceRange([0, 1000])}>Price: ${priceRange[0]} - ${priceRange[1]} <span className="ml-1">×</span></Badge>
          )}
          {listings.some(l => l.featured) && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-300 cursor-pointer" onClick={() => setListings(listings.filter(l => !l.featured))}>Featured Only <span className="ml-1">×</span></Badge>
          )}
        </div>
        {/* LISTINGS */}
        {loading && listings.length === 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading listings">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col h-full animate-fade-in-slow">
                <Skeleton className="w-full aspect-[3/4] mb-3" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-1" />
                <div className="flex gap-2 mt-auto">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[260px] text-center text-muted-foreground animate-fade-in-slow">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 animate-bounce-slow">
              <ellipse cx="60" cy="60" rx="50" ry="50" fill="#f3f3f3" stroke="#d1d5db" strokeWidth="4" />
              <ellipse cx="60" cy="80" rx="18" ry="8" fill="#e5e7eb" />
              <circle cx="45" cy="55" r="8" fill="#d1d5db" />
              <circle cx="75" cy="55" r="8" fill="#d1d5db" />
              <rect x="40" y="70" width="40" height="8" rx="4" fill="#e5e7eb" />
              <rect x="85" y="85" width="18" height="6" rx="3" fill="#d1d5db" transform="rotate(30 85 85)" />
              <rect x="17" y="85" width="18" height="6" rx="3" fill="#d1d5db" transform="rotate(-30 17 85)" />
              <ellipse cx="60" cy="60" rx="50" ry="50" fill="#fff" fillOpacity="0.1" />
              <path d="M50 90 Q60 100 70 90" stroke="#d1d5db" strokeWidth="2" fill="none" />
            </svg>
            <div className="font-semibold mb-1 text-lg">No listings found</div>
            <div className="mb-2 text-sm">Try changing your filters or search terms.<br/>Or <a href="/" className="underline hover:text-primary">return home</a>.</div>
            <a href="/listings/create" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition mt-2">List an item</a>
            <style jsx>{`
              @keyframes bounce-slow {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
              }
              .animate-bounce-slow {
                animation: bounce-slow 2.2s infinite;
              }
              .animate-fade-in-slow {
                animation: fade-in 1.2s cubic-bezier(.4,0,.2,1) both;
              }
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="list" aria-label="Listings grid">
              {listings.map((l, idx) => (
                <div
                  key={l.id}
                  onClick={() => setPreviewListing(l)}
                  className={`cursor-pointer focus:outline focus:outline-2 focus:outline-primary transition-all duration-500 listing-card-delay delay-${idx}`}
                  tabIndex={0}
                  role="listitem"
                  aria-label={`Preview ${l.title}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPreviewListing(l); }}
                >
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
            {/* Quick Preview Modal */}
            {previewListing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label={previewListing.title}>
                <div className="bg-white rounded-xl p-6 w-[95vw] max-w-lg border-2 border-black shadow-xl relative animate-fade-in-slow">
                  <button className="absolute top-2 right-2 text-lg font-bold" onClick={() => setPreviewListing(null)} aria-label="Close Preview">×</button>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0 w-full md:w-1/2 flex items-center justify-center">
                      {previewListing.primaryImageUrl ? (
                        <img src={previewListing.primaryImageUrl} alt={previewListing.title} className="rounded-lg max-h-60 object-contain w-full" />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500">No image</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{previewListing.title}</span>
                        {previewListing.featured && <span className="bg-yellow-300 text-black font-bold px-2 py-1 rounded-full border border-yellow-500 text-xs ml-2">★ Featured</span>}
                        {/* Category icon */}
                        {categoryOptions.find(opt => opt.value === previewListing.category)?.icon && (
                          <span className="ml-1 text-xl" title={categoryOptions.find(opt => opt.value === previewListing.category)?.label}>
                            {categoryOptions.find(opt => opt.value === previewListing.category)?.icon}
                          </span>
                        )}
                      </div>
                      <div className="text-primary font-bold text-xl">${Number(previewListing.price).toFixed(2)}</div>
                      <div className="flex gap-2 text-xs items-center">
                        <span className="bg-zinc-800 text-white px-2 py-1 rounded">{previewListing.category}</span>
                        <span className="bg-zinc-700 text-white px-2 py-1 rounded">{previewListing.condition}</span>
                        {/* Views if >= 100 */}
                        {typeof previewListing.views === 'number' && previewListing.views >= 100 && (
                          <span className="flex items-center gap-1 text-gray-500 ml-2" title="Views">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
                            {previewListing.views}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">{previewListing.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {previewListing.sellerAvatar ? (
                          <img src={previewListing.sellerAvatar} alt={previewListing.sellerName ?? 'Unknown Seller'} className="w-7 h-7 rounded-full border border-black" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-300 border border-black flex items-center justify-center text-xs">?</div>
                        )}
                        <span className="text-xs font-semibold">{previewListing.sellerName ?? 'Unknown Seller'}</span>
                        {/* Seller rating if available */}
                        {typeof previewListing.rating === 'number' && previewListing.rating > 0 && (
                          <span className="flex items-center gap-1 ml-2" title="Seller rating">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < Math.round(Number(previewListing.rating) || 0) ? 'text-yellow-400' : 'text-gray-300'} fill={i < Math.round(Number(previewListing.rating) || 0) ? 'currentColor' : 'none'} />
                            ))}
                            <span className="text-xs text-muted-foreground">{Number(previewListing.rating).toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <a href={`/listings/${previewListing.id || previewListing.listingId}`} className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">View Listing</a>
                        <button className="comic-button px-4 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-800 transition" onClick={() => setPreviewListing(null)}>Close</button>
                        {/* Share button */}
                        <button
                          className="comic-button px-3 py-2 rounded bg-zinc-200 text-zinc-800 border border-zinc-400 hover:bg-zinc-300 transition min-w-[36px]"
                          title="Copy link"
                          onClick={() => {
                            const url = `${window.location.origin}/listings/${previewListing.id || previewListing.listingId}`;
                            navigator.clipboard.writeText(url);
                          }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M16 8a6 6 0 00-6 6v1a1 1 0 002 0v-1a4 4 0 118 0v1a6 6 0 01-6 6h-4a6 6 0 01-6-6v-1a1 1 0 112 0v1a4 4 0 004 4h4a4 4 0 004-4v-1a6 6 0 00-6-6z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center my-6">
                {loadingMore ? (
                  <Spinner size={32} />
                ) : (
                  <Button onClick={() => { setLoadingMore(true); loadListings(); }} variant="outline">Load More</Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

<style jsx global>{`
  .listing-card-delay {
    /* fallback if no delay class is present */
    transition-delay: 0ms;
  }
  ${Array.from({ length: 100 })
    .map((_, i) => `.delay-${i} { transition-delay: ${i * 40}ms; }`)
    .join('\n')}
`}</style>
