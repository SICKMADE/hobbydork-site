'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Listing } from '@/lib/types';

// Match listing categories (enum values) with labels
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

type SortOrder = 'newest' | 'price-asc' | 'price-desc';

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const firestore = useFirestore();

  const listingsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'listings');
  }, [firestore]);

  const { data: listings, isLoading } = useCollection<Listing>(listingsCollection);

  const toggleCategory = (value: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedCategories((prev) =>
      isChecked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  const toggleCondition = (value: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSelectedConditions((prev) =>
      isChecked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  const normalizedListings = useMemo(() => {
    if (!listings) return [];
    return listings.filter((l) => l.state === 'ACTIVE'); // only active listings on search
  }, [listings]);

  const filteredListings = useMemo(() => {
    let result = [...normalizedListings];

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((l) => {
        const title = (l.title || '').toLowerCase();
        const tags = Array.isArray(l.tags)
          ? l.tags.join(' ').toLowerCase()
          : '';
        return title.includes(term) || tags.includes(term);
      });
    }

    if (selectedCategories.length > 0) {
      result = result.filter((l) =>
        selectedCategories.includes(String(l.category)),
      );
    }

    if (selectedConditions.length > 0) {
      result = result.filter((l) =>
        selectedConditions.includes(String(l.condition)),
      );
    }

    const [minPrice, maxPrice] = priceRange;
    result = result.filter((l) => {
      const price =
        typeof l.price === 'number' ? l.price : Number(l.price || 0);
      return price >= minPrice && price <= maxPrice;
    });

    result.sort((a, b) => {
      if (sortOrder === 'price-asc' || sortOrder === 'price-desc') {
        const pa = typeof a.price === 'number' ? a.price : Number(a.price || 0);
        const pb = typeof b.price === 'number' ? b.price : Number(b.price || 0);
        if (sortOrder === 'price-asc') return pa - pb;
        return pb - pa;
      }

      // default: newest (createdAt desc if available)
      const ta = (a as any).createdAt?.toDate
        ? (a as any).createdAt.toDate().getTime()
        : 0;
      const tb = (b as any).createdAt?.toDate
        ? (b as any).createdAt.toDate().getTime()
        : 0;
      return tb - ta;
    });

    return result;
  }, [normalizedListings, searchTerm, selectedCategories, selectedConditions, priceRange, sortOrder]);

  const resultCount = filteredListings.length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for anything..."
              className="pl-10 h-12 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            size="lg"
            className="h-12"
            onClick={() => {
              // no-op; filtering is live. Keeping button for UX.
            }}
          >
            Search
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {resultCount} result{resultCount === 1 ? '' : 's'}
          </p>
          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as SortOrder)}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort by: Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside
            className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}
          >
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <div className="space-y-2">
                    {categoryOptions.map((category) => (
                      <div
                        key={category.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={category.value}
                          checked={selectedCategories.includes(category.value)}
                          onCheckedChange={(checked) =>
                            toggleCategory(category.value, checked)
                          }
                        />
                        <Label
                          htmlFor={category.value}
                          className="font-normal"
                        >
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Price Range</h3>
                  <Slider
                    value={priceRange}
                    onValueChange={(val) =>
                      setPriceRange([val[0], val[1]] as [number, number])
                    }
                    min={0}
                    max={15000}
                    step={100}
                  />
                  <div className="flex justify-between text-muted-foreground text-sm mt-2">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Condition</h3>
                  <div className="space-y-2">
                    {conditionOptions.map((condition) => (
                      <div
                        key={condition.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={condition.value}
                          checked={selectedConditions.includes(condition.value)}
                          onCheckedChange={(checked) =>
                            toggleCondition(condition.value, checked)
                          }
                        />
                        <Label
                          htmlFor={condition.value}
                          className="font-normal"
                        >
                          {condition.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    type="button"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedConditions([]);
                      setPriceRange([0, 15000]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="lg:col-span-3">
            {isLoading && <p>Loading listings...</p>}
            {!isLoading && filteredListings.length === 0 && (
              <p>No listings found.</p>
            )}
            {!isLoading && filteredListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
