'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import AppLayout from '@/components/layout/AppLayout';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import type { Listing } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal } from 'lucide-react';
import ListingCard from '@/components/ListingCard';

type SortOrder = 'newest' | 'price-asc' | 'price-desc';

const categoryOptions = [
  { value: 'COMIC_BOOKS', label: 'Comic Books' },
  { value: 'SPORTS_CARDS', label: 'Sports Cards' },
  { value: 'POKEMON_CARDS', label: 'Pokémon Cards' },
  { value: 'VIDEO_GAMES', label: 'Video Games' },
  { value: 'TOYS', label: 'Toys' },
  { value: 'OTHER', label: 'Other' },
];

const conditionOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

export default function BrowsePage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const q = (searchParams?.get('q') || '').trim().toLowerCase();

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    // Only ACTIVE listings, newest first
    return query(
      collection(firestore, 'listings'),
      where('state', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore]);

  const {
    data: listings,
    isLoading,
  } = useCollection<Listing>(listingsQuery);

  const filteredListings = useMemo(() => {
    let items: any[] = (listings as any[]) || [];

    // Text search from header (?q=)
    if (q) {
      items = items.filter((l) => {
        const haystack = [
          l.title,
          l.series,
          l.description,
          l.storeName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    // Category filter (if your docs have l.category)
    if (selectedCategories.length > 0) {
      items = items.filter((l) =>
        selectedCategories.includes(l.category),
      );
    }

    // Condition filter (if your docs have l.condition)
    if (selectedConditions.length > 0) {
      items = items.filter((l) =>
        selectedConditions.includes(l.condition),
      );
    }

    // Sort
    const getCreatedAt = (l: any) =>
      l.createdAt?.toMillis
        ? l.createdAt.toMillis()
        : 0;

    const getPriceNumber = (l: any) => {
      if (typeof l.priceCents === 'number') {
        return l.priceCents / 100;
      }
      if (typeof l.price === 'number') {
        return l.price;
      }
      return 0;
    };

    items = [...items]; // copy before sort

    if (sortOrder === 'newest') {
      items.sort((a, b) => getCreatedAt(b) - getCreatedAt(a));
    } else if (sortOrder === 'price-asc') {
      items.sort(
        (a, b) => getPriceNumber(a) - getPriceNumber(b),
      );
    } else if (sortOrder === 'price-desc') {
      items.sort(
        (a, b) => getPriceNumber(b) - getPriceNumber(a),
      );
    }

    return items;
  }, [listings, q, selectedCategories, selectedConditions, sortOrder]);

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  };

  const toggleCondition = (value: string) => {
    setSelectedConditions((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  };

  const total = filteredListings.length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Header row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Browse listings
            </h1>
            <p className="text-sm text-muted-foreground">
              Use the search bar at the top to find anything.
              Filter and sort results here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1">
              {isLoading ? 'Loading…' : `${total} results`}
            </Badge>

            <Select
              value={sortOrder}
              onValueChange={(v) =>
                setSortOrder(v as SortOrder)
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  Newest first
                </SelectItem>
                <SelectItem value="price-asc">
                  Price: low → high
                </SelectItem>
                <SelectItem value="price-desc">
                  Price: high → low
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? 'Hide filters' : 'Show filters'}
            </Button>
          </div>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Filters
              </CardTitle>
              <CardDescription className="text-xs">
                Refine results by category and condition.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {/* Categories */}
              <div>
                <p className="text-xs font-semibold mb-2">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {categoryOptions.map((cat) => (
                    <label
                      key={cat.value}
                      className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedCategories.includes(
                          cat.value,
                        )}
                        onCheckedChange={() =>
                          toggleCategory(cat.value)
                        }
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <p className="text-xs font-semibold mb-2">
                  Condition
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {conditionOptions.map((cond) => (
                    <label
                      key={cond.value}
                      className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedConditions.includes(
                          cond.value,
                        )}
                        onCheckedChange={() =>
                          toggleCondition(cond.value)
                        }
                      />
                      <span>{cond.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results grid */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[260px] w-full" />
            ))}
          </div>
        )}

        {!isLoading && total === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No listings found. Try changing your filters or
              search terms.
            </CardContent>
          </Card>
        )}

        {!isLoading && total > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredListings.map((listing: any) => (
              <ListingCard
                key={listing.id || listing.listingId}
                listing={listing}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
