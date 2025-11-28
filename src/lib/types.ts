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

export type Condition = 'New' | 'Like New' | 'Used';

export type Listing = {
  id: string;
  storefrontId: string;
  title: string;
  category: string;
  description: string;
  price: number;
  condition: Condition;
  quantity: number;
  images: string[];
  tags: string[];
  createdAt: Timestamp;
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
    userId: string;
    userName: string;
    userAvatar: string;
    title: string;
    category: string;
    description: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
}
