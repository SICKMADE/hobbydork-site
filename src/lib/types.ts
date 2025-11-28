export type UserStatus = 'ACTIVE' | 'LIMITED' | 'SUSPENDED';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  storeId?: string;
};

export type Store = {
  id: string;
  name: string;
  url: string;
  logo: string;
  about: string;
  ownerId: string;
  paymentMethods: {
    paypal?: string;
    venmo?: string;
  };
  rating: number;
  itemsSold: number;
};

export type Condition = 'New' | 'Like New' | 'Used';

export type Listing = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  condition: Condition;
  quantity: number;
  images: string[];
  tags: string[];
  storeId: string;
  createdAt: string;
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
  createdAt: string;
};
