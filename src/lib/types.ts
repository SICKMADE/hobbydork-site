import { Timestamp } from "firebase/firestore";

export type UserStatus = 'ACTIVE' | 'LIMITED' | 'SUSPENDED';

export type User = {
  uid: string;
  email: string;
  displayName: string;
  avatar?: string;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  role: "user" | "admin";
  storeId?: string;
  paymentMethod?: "PAYPAL" | "VENMO";
  paymentIdentifier?: string;
  emailVerified: boolean;
  oneAccountAcknowledged?: boolean;
  goodsAndServicesAgreed?: boolean;
  notificationPreferences?: {
    notifyMessages: boolean;
    notifyOrders: boolean;
    notifyISO24: boolean;
    notifySpotlight: boolean;
  };
};

export type Store = {
  storeId: string;
  ownerUid: string;
  storeName: string;
  slug: string;
  about: string;
  avatarUrl: string | null;
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
  id: string; // Document ID
  listingId: string;
  storeId: string;
  ownerUid: string;
  title: string;
  category: string;
  description: string;
  price: number;
  condition: Condition;
  quantityTotal: number;
  quantityAvailable: number;
  state: ListingState;
  tags: string[];
  imageUrls: string[];
  primaryImageUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type OrderStatus = 'Pending Payment' | 'Payment Sent' | 'Shipped' | 'Delivered' | 'Completed' | 'Cancelled';

export type Order = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: Timestamp;
};

export type Chat = {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: Timestamp;
};

export type ISO24 = {
    id: string;
    creatorUid: string;
    userName: string;
    userAvatar: string;
    title: string;
    category: string;
    description: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    status: 'ACTIVE' | 'EXPIRED';
}
