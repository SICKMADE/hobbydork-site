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
import Link from "next/link";

export default function MyListingsPage() {
    const { profile, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const listingsQuery = useMemoFirebase(() => {
        if (!firestore || !profile?.storeId) return null;
        return query(collection(firestore, 'listings'), where('storeId', '==', profile.storeId));
    }, [firestore, profile?.storeId]);

    const { data: listings, isLoading: listingsLoading } = useCollection<Listing>(listingsQuery);

    if (authLoading) {
        return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;
    }

    if (!profile?.isSeller) {
        return (
            <AppLayout>
                <PlaceholderContent 
                    title="You are not a seller"
                    description="You need to create a store before you can view or create listings."
                >
                    <Button asChild className="mt-4">
                        <Link href="/store/create">Create a Store</Link>
                    </Button>
                </PlaceholderContent>
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

            {(authLoading || listingsLoading) && <p>Loading your listings...</p>}

            {!listingsLoading && listings && listings.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
            
            {!listingsLoading && (!listings || listings.length === 0) && (
                 <PlaceholderContent 
                    title="No Listings Yet"
                    description="Click the button above to create your first listing and start selling!"
                />
            )}
        </AppLayout>
    );
}
