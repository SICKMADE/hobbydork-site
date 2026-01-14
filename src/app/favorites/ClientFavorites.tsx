'use client';

import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { favoriteStoreConverter } from "@/firebase/firestore/converters";
import type { Store, FavoriteStoreItem } from "@/lib/types";
import PlaceholderContent from "@/components/PlaceholderContent";
import StoreCard from "@/components/StoreCard";
import { useDoc } from "@/firebase/firestore/use-doc";

function FavoriteStore({ storeId }: { storeId: string }) {
  const firestore = useFirestore();
  const { user, profile, loading: authLoading } = useAuth();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    //
    profile?.status === "ACTIVE";
  const storeRef = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore) return null;
    return doc(firestore, "stores", storeId);
  }, [canReadFirestore, firestore, storeId]);

  const { data: store, isLoading } = useDoc<Store>(canReadFirestore ? storeRef : null);

  if (isLoading) {
    return <div>Loading store...</div>;
  }

  if (!store) {
    return null;
  }

  return <StoreCard store={store} />;
}

export default function ClientFavorites() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    profile?.status === "ACTIVE";
  const favoritesQuery = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !profile?.uid) return null;
    return collection(
      firestore,
      `users/${profile.uid}/favoriteStores`
    ).withConverter(favoriteStoreConverter);
  }, [canReadFirestore, firestore, profile]);
  const { data: favoriteItems, isLoading } =
    useCollection<FavoriteStoreItem>(canReadFirestore ? favoritesQuery : null);

  // Early returns after hooks
  if (authLoading) return null;
  if (!user) return null;

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Favorite Stores</h1>
        {isLoading && <p>Loading your favorite stores...</p>}
        {!isLoading && (!favoriteItems || favoriteItems.length === 0) && (
          <PlaceholderContent
            title="No Favorite Stores Yet"
            description="Add stores to your favorites to see them here."
          >
            <div className="mt-4 flex justify-center">
              <a href="/stores" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Browse Stores</a>
            </div>
          </PlaceholderContent>
        )}
        {!isLoading && favoriteItems && favoriteItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favoriteItems.map((item) => (
              <FavoriteStore key={item.storeId} storeId={item.storeId} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
