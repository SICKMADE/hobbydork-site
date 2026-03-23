
import { Timestamp } from "firebase/firestore";

export type UserStatus = 'ACTIVE' | 'LIMITED' | 'SUSPENDED';

export type User = {
    uid: string;
    email: string;
    displayName: string | null;
    avatar?: string;
    photoURL?: string;
    username?: string;
    status: UserStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    role: string;
    isSeller: boolean;
    storeId?: string;
    paymentMethod: "STRIPE" | null;
    paymentIdentifier: string | null;
    emailVerified: boolean;
    oneAccountAcknowledged: boolean;
    stripeTermsAgreed: boolean;
    blockedUsers: string[];
    stripeAccountId?: string | null;
    ownedPremiumProducts?: string[];
    shippingAddress?: {
        name?: string;
        address1?: string;
        address2?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    sellerStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    sellerTier?: "1_HEART" | "2_HEARTS" | "3_HEARTS";
    onTimeShippingRate?: number;
    completedOrders?: number;
    lateShipmentsLast30d?: number;
    lateShipmentsLast60d?: number;
    lastTierChange?: Timestamp;
};

export type PlatformBounty = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    status: 'LIVE' | 'ENDED';
    endsAt: Timestamp;
    entryCount?: number;
};

export type BountyEntry = {
    id: string;
    uid: string;
    bountyId: string;
    platform: string;
    timestamp: Timestamp;
};

export type Store = {
  storeId: string;
  ownerUid: string;
  storeName: string;
  slug: string;
  about: string;
  avatarUrl: string;
  storeImageUrl?: string | null;
  ratingAverage: number;
  ratingCount: number;
  itemsSold: number;
  status: "ACTIVE" | "HIDDEN" | "DISABLED";
  isSpotlighted: boolean;
  spotlightUntil: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Condition = "NEW" | "LIKE_NEW" | "VERY_GOOD" | "GOOD" | "FAIR" | "POOR";
export type ListingState = "DRAFT" | "ACTIVE" | "HIDDEN" | "SOLD";

export type Listing = {
    id: string; 
    listingSellerId: string;
    title: string;
    category: string;
    description: string;
    price: number;
    condition: string;
    state: ListingState;
    tags: string[];
    imageUrl: string;
    imageUrls?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    sellerName?: string;
    sellerTier?: string;
    type: 'Auction' | 'Buy It Now';
    currentBid?: number;
    bidCount?: number;
    endsAt?: any;
    expiresAt?: any;
    winnerUid?: string | null;
    winningBid?: number | null;
    paymentStatus?: 'PENDING' | 'PAID' | null;
    quantity?: number;
    sellerOnVacation?: boolean;
};

export type Order = {
    id: string;
    buyerUid: string;
    sellerUid: string;
    listingId: string;
    listingTitle: string;
    price: number;
    status: string;
    imageUrl?: string;
    trackingNumber?: string | null;
    carrier?: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    buyerCanCancel?: boolean;
    buyerName?: string;
    sellerName?: string;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    shippingAddress?: any;
};

export type ISO24Post = {
    id: string;
    uid: string;
    userName: string;
    title: string;
    category: string;
    budget: number;
    description: string;
    status: 'Searching' | 'Found';
    postedAt: Timestamp;
};

export type CommunityMessage = {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    avatarUrl?: string;
    timestamp: Timestamp;
};

export type Review = {
    id: string;
    sellerId: string;
    buyerUid: string;
    buyerName: string;
    rating: number; 
    comment: string;
    listingTitle: string;
    timestamp: Timestamp;
};
