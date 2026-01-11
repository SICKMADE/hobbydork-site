import type { SellerApplication } from '@/lib/types';

export const sellerApplicationConverter: FirestoreDataConverter<SellerApplication> = {
  toFirestore(app: SellerApplication) {
    const { applicationId, ...rest } = app as Partial<SellerApplication>;
    return rest;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<SellerApplication>;
    return {
      ...data,
      applicationId: data?.applicationId ?? snapshot.id,
    } as SellerApplication;
  },
};
import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import type {
  Listing,
  SpotlightSlot,
  FavoriteStoreItem,
  WatchlistItem,
  Review,
  Store,
} from '@/lib/types'

export const listingConverter: FirestoreDataConverter<Listing> = {
  toFirestore(listing: Listing) {
    // store as-is; Timestamp fields are handled by Firestore SDK when using serverTimestamp
    const { id, ...rest } = listing as Partial<Listing>
    return rest
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<Listing>
    return {
      ...data,
      id: snapshot.id,
    } as Listing
  },
}

export const spotlightConverter: FirestoreDataConverter<SpotlightSlot> = {
  toFirestore(slot: SpotlightSlot) {
    const { slotId, ...rest } = slot as Partial<SpotlightSlot>
    return rest
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<SpotlightSlot>
    return {
      ...data,
      slotId: data?.slotId ?? snapshot.id,
    } as SpotlightSlot
  },
}

export const favoriteStoreConverter: FirestoreDataConverter<FavoriteStoreItem> = {
  toFirestore(item: FavoriteStoreItem) {
    return { ...item }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<FavoriteStoreItem>
    return {
      ...data,
    } as FavoriteStoreItem
  },
}

export const watchlistConverter: FirestoreDataConverter<WatchlistItem> = {
  toFirestore(item: WatchlistItem) {
    return { ...item }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<WatchlistItem>
    return {
      ...data,
    } as WatchlistItem
  },
}

export const storeConverter: FirestoreDataConverter<Store> = {
  toFirestore(store: Store) {
    const { storeId, id, ...rest } = store as Partial<Store>
    return rest
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<Store>
    return {
      ...data,
      storeId: data?.storeId ?? snapshot.id,
    } as Store
  },
}

export const reviewConverter: FirestoreDataConverter<Review> = {
  toFirestore(review: Review) {
    const { reviewId, ...rest } = review as Partial<Review>;
    return rest;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) {
    const data = snapshot.data(options) as Partial<Review>;
    return {
      ...data,
      reviewId: (data?.reviewId as string) ?? snapshot.id,
    } as Review;
  },
};

export default {
  listingConverter,
  spotlightConverter,
  favoriteStoreConverter,
  watchlistConverter,
  reviewConverter,
}
