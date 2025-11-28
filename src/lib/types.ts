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

export type OrderState = "PENDING_PAYMENT" | "PAYMENT_SENT" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";

export type ShippingAddress = {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export type Order = {
  id: string;
  orderId: string;
  buyerUid: string;
  sellerUid: string;
  storeId: string;
  listingItems: { 
      listingId: string;
      title: string;
      quantity: number;
      pricePerUnit: number;
      primaryImageUrl: string | null;
  }[];
  totalPrice: number;
  state: OrderState;
  buyerShippingAddress: ShippingAddress | null;
  paymentMethod: "PAYPAL" | "VENMO";
  paymentIdentifier?: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
