
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
  role: string;
  isSeller: boolean;
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

export type CommunityMessage = {
    id: string; // Document ID from useCollection
    messageId: string;
    senderUid: string;
    text: string;
    createdAt: Timestamp;
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

export type NotificationType = "MESSAGE" | "ORDER" | "ORDER_STATUS" | "ISO24" | "SPOTLIGHT" | "GENERIC";

export type Notification = {
    id: string;
    userUid: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId: string | null; // e.g., orderId, conversationId
    createdAt: Timestamp;
    read: boolean;
}

export type Review = {
    reviewId: string;
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

export type SpotlightSlot = {
    slotId: string;
    storeId: string;
    ownerUid: string;
    startAt: Timestamp;
    endAt: Timestamp;
    active: boolean;
}

export type Conversation = {
    conversationId: string;
    participantUids: string[];
    lastMessageText: string;
    lastMessageAt: Timestamp;
    createdAt: Timestamp;
}

export type Message = {
    messageId: string;
    senderUid: string;
    text: string;
    createdAt: Timestamp;
    readBy: string[];
}

export type WatchlistItem = {
    listingId: string;
    addedAt: Timestamp;
}

export type FavoriteStoreItem = {
    storeId: string;
    addedAt: Timestamp;
}

export type Report = {
    reportId: string;
    reporterUid: string;
    targetType: "USER" | "LISTING" | "ORDER";
    targetId: string;
    reason: string;
    details: string;
    createdAt: Timestamp;
    status: "OPEN" | "REVIEWED" | "RESOLVED";
}
