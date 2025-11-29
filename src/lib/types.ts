
import { Timestamp } from "firebase/firestore";

export type UserStatus = 'ACTIVE' | 'LIMITED' | 'SUSPENDED';

export type User = {
  uid: string;
  email: string;
  displayName: string | null;
  avatar?: string;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  role: "USER" | "ADMIN";
  storeId?: string;
  paymentMethod: "PAYPAL" | "VENMO" | null;
  paymentIdentifier: string | null;
  emailVerified: boolean;
  oneAccountAcknowledged: boolean;
  goodsAndServicesAgreed: boolean;
  notifyMessages: boolean;
  notifyOrders: boolean;
  notifyISO24: boolean;
  notifySpotlight: boolean;
  blockedUsers: string[];
};

export type Store = {
  id?: string;
  storeId: string;
  ownerUid: string;
  storeName: string;
  slug: string;
  about: string;
  avatarUrl: string;
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
    address2?: string | null;
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
  items: { 
      listingId: string;
      title: string;
      quantity: number;
      pricePerUnit: number;
  }[];
  totalPrice: number;
  state: OrderState;
  buyerShippingAddress: ShippingAddress | null;
  paymentMethod: "PAYPAL" | "VENMO";
  paymentIdentifier: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  cancelReason: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewId?: string; // ID of the review associated with this order
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
    title: string;
    category: string;
    description: string;
    imageUrl?: string | null;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    status: 'ACTIVE' | 'EXPIRED';
}

export type NotificationType = "MESSAGE" | "ORDER" | "ORDER_STATUS" | "ISO24" | "SPOTLIGHT";

export type Notification = {
    id: string;
    userUid: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId: string; // e.g., orderId, conversationId
    createdAt: Timestamp;
    read: boolean;
}

export type Review = {
    id: string; // Should be the same as orderId
    orderId: string;
    storeId: string;
    sellerUid: string;
    buyerUid: string;
    buyerName: string;
    buyerAvatar: string;
    rating: number; // 1-5
    comment: string;
    createdAt: Timestamp;
}

    

    