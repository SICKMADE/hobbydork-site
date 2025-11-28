'use client';

import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Listing } from "@/lib/types";


const categories = ["Trading Cards", "Action Figures", "Comics", "Memorabilia", "Video Games", "Stamps"];
const conditions = ["New", "Like New", "Used"];

export default function SearchPage() {
    const [showFilters, setShowFilters] = useState(true);
    const firestore = useFirestore();

    const listingsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'listings');
    }, [firestore]);

    const {data: listings, isLoading} = useCollection<Listing>(listingsCollection);

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
                        />
                    </div>
                    <Button size="lg" className="h-12">Search</Button>
                    <Button variant="outline" size="lg" className="h-12 lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                        <SlidersHorizontal className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">Showing 1-{listings?.length || 0} of {listings?.length || 0} results</p>
                    <Select defaultValue="newest">
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
                    <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Filters</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Category</h3>
                                    <div className="space-y-2">
                                        {categories.map(category => (
                                            <div key={category} className="flex items-center space-x-2">
                                                <Checkbox id={category} />
                                                <Label htmlFor={category} className="font-normal">{category}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-2">Price Range</h3>
                                    <Slider
                                        defaultValue={[0, 15000]}
                                        max={15000}
                                        step={100}
                                    />
                                    <div className="flex justify-between text-muted-foreground text-sm mt-2">
                                        <span>$0</span>
                                        <span>$15,000</span>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-2">Condition</h3>
                                    <div className="space-y-2">
                                        {conditions.map(condition => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox id={condition} />
                                                <Label htmlFor={condition} className="font-normal">{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button className="w-full">Apply Filters</Button>
                                <Button variant="outline" className="w-full">Clear Filters</Button>

                            </CardContent>
                        </Card>
                    </aside>

                    <section className="lg:col-span-3">
                        {isLoading && <p>Loading listings...</p>}
                        {listings && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {listings.map((listing) => (
                                    <ListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        )}
                         {(!listings || listings.length === 0) && !isLoading && <p>No listings found.</p>}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
