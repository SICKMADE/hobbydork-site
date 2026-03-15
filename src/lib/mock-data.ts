
export type Category = 'Watches' | 'Cards' | 'Coins' | 'Toys' | 'Stamps' | 'Comics' | 'Other';
export type SellerTier = 'Bronze' | 'Silver' | 'Gold';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  seller: string;
  sellerId?: string;
  listingSellerId?: string;
  sellerName?: string;
  buyer?: string;
  status: 'Active' | 'Sold' | 'Ended';
  visibility?: 'Visible' | 'Invisible';
  condition?: 'New' | 'Like New' | 'Used';
  type: 'Auction' | 'Buy It Now';
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  shippingCost?: number | null;
  expiresAt?: any; // Expiration date for Buy It Now
  endsAt?: any;
  currentBid?: number;
  bidCount?: number;
  tags: string[];
  createdAt: any;
  // Stock tracking for Buy It Now listings
  quantity?: number; // Number of items available (default: 1)
  winnerUid?: string | null;
  winningBid?: number | null;
  paymentStatus?: 'PENDING' | 'PAID' | null;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  seller: string;
  sellerId?: string;
  sellerName?: string;
  winnerName?: string;
  status: 'Active' | 'Ended';
  endsAt: any;
  entriesCount: number;
  prizeValue: number;
}

export interface ISOItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  budget: number;
  user: string;
  postedAt: any;
  status: 'Searching' | 'Found';
}

export interface FeaturedStore {
  username: string;
  tagline: string;
  avatarUrl: string;
  bannerUrl: string;
  totalSales: number;
  tier: SellerTier;
  featuredItems: string[]; 
}

export interface PremiumProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Spotlight' | 'Utility';
}

export const CATEGORIES: Category[] = ['Watches', 'Cards', 'Coins', 'Toys', 'Stamps', 'Comics', 'Other'];

// Grading options removed

export const LISTINGS: Listing[] = [
  {
    id: 'wolverine-1',
    title: 'Wolverine #1 (1982) - Signed by Chris Claremont',
    description: 'First solo Wolverine series. CGC 9.8 white pages. Iconic Frank Miller cover art. Essential grail for any X-Men fan.',
    price: 4500,
    category: 'Comics',
    imageUrl: 'https://picsum.photos/seed/wolverine1/600/800',
    seller: 'Logan_Fan_X',
    status: 'Active',
    type: 'Buy It Now',
    tags: ['wolverine', 'marvel', 'signed', 'grail'],
    createdAt: new Date(),
    condition: 'Like New'
  },
  {
    id: '1',
    title: 'Vintage Rolex Submariner 5513',
    description: 'Beautifully aged patina, recently serviced. Rare meters first dial.',
    price: 12500,
    category: 'Watches',
    imageUrl: 'https://picsum.photos/seed/submariner/600/800',
    seller: 'TimeKeeper_88',
    status: 'Active',
    type: 'Buy It Now',
    tags: ['rolex', 'vintage', 'luxury', 'submariner'],
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Pikachu Illustrator Card - PSA 10',
    description: 'One of the holy grails of Pokemon card collecting. Flawless condition.',
    price: 50000,
    category: 'Cards',
    imageUrl: 'https://picsum.photos/seed/pikachu/600/800',
    seller: 'CardKing_JP',
    status: 'Active',
    type: 'Auction',
    currentBid: 42000,
    bidCount: 12,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    tags: ['pokemon', 'pikachu', 'rare', 'psa10'],
    createdAt: new Date()
  },
  {
    id: '3',
    title: '1893-S Morgan Silver Dollar',
    description: 'PCGS MS65. Key date Morgan Dollar. Stunning luster and original surfaces.',
    price: 180000,
    category: 'Coins',
    imageUrl: 'https://picsum.photos/seed/morgan/600/800',
    seller: 'Numismatist_Supreme',
    status: 'Active',
    type: 'Auction',
    currentBid: 165000,
    bidCount: 8,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    tags: ['coin', 'silver', 'morgan', 'rare'],
    createdAt: new Date()
  }
];

export const GIVEAWAYS: Giveaway[] = [
  {
    id: 'g1',
    title: 'Silver Age Comic Mystery Box',
    description: 'Win a curated selection of 5 Silver Age comic books in high grade!',
    imageUrl: 'https://picsum.photos/seed/comicbox/800/600',
    seller: 'TimeKeeper_88',
    status: 'Active',
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    entriesCount: 142,
    prizeValue: 450
  }
];

export const SPOTLIGHT_STORES: FeaturedStore[] = [
  {
    username: 'TimeKeeper_88',
    tagline: 'Precision is our passion. Vintage watches curated with soul.',
    avatarUrl: '',
    bannerUrl: '',
    totalSales: 124,
    tier: 'Gold',
    featuredItems: []
  }
];

export const PREMIUM_PRODUCTS: PremiumProduct[] = [
  {
    id: 'p1',
    name: 'Weekly Spotlight',
    description: 'Dominate the home page for 7 full days. Reach half a million collectors instantly.',
    price: 199,
    category: 'Spotlight'
  },
  {
    id: 'p2',
    name: 'Neon Syndicate Theme',
    description: 'Recommended: A cyberpunk-luxe aesthetic with electric cyan glows and obsidian glass panels.',
    price: 9.99,
    category: 'Utility'
  },
  {
    id: 'p3',
    name: 'Urban Theme',
    description: 'Give your shop a gritty, industrial billboard look for that street-collector vibe.',
    price: 9.99,
    category: 'Utility'
  },
  {
    id: 'p4',
    name: 'Comic Book Theme',
    description: 'Gritty Noir aesthetic with newsprint halftone dots, heavy ink outlines, and 2D shadows.',
    price: 9.99,
    category: 'Utility'
  },
  {
    id: 'p5',
    name: 'Hobby Shop Theme',
    description: 'Capture the local retail vibe with Field Grass backgrounds and professional Graded Slab listings.',
    price: 9.99,
    category: 'Utility'
  },
  {
    id: 'p6',
    name: 'Verified Dealer Pro',
    description: 'Unlock the blue trust shield and get priority support + lower escrow fees.',
    price: 29,
    category: 'Utility'
  }
];

// Utility function to check if a Buy It Now listing is expired
export function isListingExpired(listing: Listing): boolean {
  if (!listing.expiresAt || listing.type !== 'Buy It Now') return false;
  
  const expirationDate = listing.expiresAt.toDate ? listing.expiresAt.toDate() : new Date(listing.expiresAt);
  return new Date() > expirationDate;
}
