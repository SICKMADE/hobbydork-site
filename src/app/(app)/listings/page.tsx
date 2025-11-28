'use client';
import AppLayout from "@/components/layout/AppLayout";
import PlaceholderContent from "@/components/PlaceholderContent";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Listing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";

export default function MyListingsPage() {
    const { profile } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const listingsQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.storeId) return null;
        return query(collection(firestore, 'listings'), where('storefrontId', '==', profile.storeId));
    }, [firestore, profile?.storeId]);

    const { data: listings, isLoading } = useCollection<Listing>(listingsQuery);

    if (!profile?.storeId) {
        return (
            <AppLayout>
                <PlaceholderContent 
                    title="No Store Found"
                    description="You need to create a store before you can view your listings."
                />
            </AppLayout>
        );
    }
    
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Listings</h1>
                <Button onClick={() => router.push('/listings/create')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Listing
                </Button>
            </div>

            {isLoading && <p>Loading your listings...</p>}

            {!isLoading && listings && listings.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
            
            {!isLoading && (!listings || listings.length === 0) && (
                 <PlaceholderContent 
                    title="No Listings Yet"
                    description="Click the button above to create your first listing and start selling!"
                />
            )}
        </AppLayout>
    );
}
