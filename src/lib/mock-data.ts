
export type Category = 'Comic Books' | 'Sports Cards' | 'TCG/Pokemon' | 'Toys' | 'Video Games' | 'Other';
export type SellerTier = '1_HEART' | '2_HEARTS' | '3_HEARTS';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  seller: string; 
  listingSellerId: string; 
  buyerUid?: string;
  status: 'Active' | 'Sold' | 'Ended';
  visibility?: 'Visible' | 'Invisible';
  condition?: 'New' | 'Like New' | 'Used';
  type: 'Auction' | 'Buy It Now';
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  shippingCost?: number | null;
  expiresAt?: any;
  endsAt?: any;
  currentBid?: number;
  bidCount?: number;
  tags: string[];
  createdAt: any;
  quantity?: number;
  winnerUid?: string | null;
  winningBid?: number | null;
  paymentStatus?: 'PENDING' | 'PAID' | null;
  sellerTier?: SellerTier;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  seller: string; 
  sellerId: string; 
  sellerName?: string;
  winnerName?: string;
  winnerUserId?: string;
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
  uid: string; 
  userName: string;
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
  category: 'Spotlight' | 'Utility' | 'Service';
}

export const CATEGORIES: Category[] = ['Comic Books', 'Sports Cards', 'TCG/Pokemon', 'Toys', 'Video Games', 'Other'];

export const LISTINGS: Listing[] = [
  {
    id: 'mantle-52',
    title: '1952 Topps Mickey Mantle #311 - PSA 8',
    description: 'The definitive grail of the hobby. Exceptional centering, vibrant colors, and remarkably sharp corners for the grade. A true museum-quality asset.',
    price: 1250000,
    category: 'Sports Cards',
    imageUrl: '/defaultbroken.jpg',
    seller: 'Heritage_Vault',
    listingSellerId: 'mock-uid-1',
    status: 'Active',
    type: 'Buy It Now',
    tags: ['mickey mantle', 'topps', 'psa', 'vintage', 'grail'],
    createdAt: new Date(),
    condition: 'Used'
  },
  {
    id: 'af-15',
    title: 'Amazing Fantasy #15 (1962) - CGC 9.6',
    description: 'First appearance of Spider-Man. One of the highest graded copies in existence. White pages, perfect registration. The cornerstone of any serious comic collection.',
    price: 3200000,
    category: 'Comic Books',
    imageUrl: '/defaultbroken.jpg',
    seller: 'Comic_King_NY',
    listingSellerId: 'mock-uid-2',
    status: 'Active',
    type: 'Auction',
    currentBid: 2850000,
    bidCount: 42,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    tags: ['spiderman', 'marvel', 'stan lee', 'cgc', 'silver age'],
    createdAt: new Date(),
    condition: 'Like New'
  },
  {
    id: 'pika-illustrator',
    title: 'Pikachu Illustrator Holo - PSA 10',
    description: 'The "Holy Grail" of Pokemon. Only 39 copies were ever awarded. This is the only known PSA 10 in private hands. Indisputable provenance.',
    price: 5250000,
    category: 'TCG/Pokemon',
    imageUrl: '/defaultbroken.jpg',
    seller: 'Vault_TCG',
    listingSellerId: 'mock-uid-3',
    status: 'Active',
    type: 'Buy It Now',
    tags: ['pokemon', 'pikachu', 'illustrator', 'holy grail'],
    createdAt: new Date(),
    condition: 'New'
  }
];

export const GIVEAWAYS: Giveaway[] = [
  {
    id: 'g1',
    title: '1977 Star Wars Series 1 Wax Pack',
    description: 'Unopened, authenticated series 1 pack from the original 1977 release. Potential for high-grade Luke Skywalker or Darth Vader rookies.',
    imageUrl: '/defaultbroken.jpg',
    seller: 'mock-uid-2',
    sellerId: 'mock-uid-2',
    sellerName: 'TimeKeeper_88',
    status: 'Active',
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    entriesCount: 1420,
    prizeValue: 1200
  }
];

export const PREMIUM_PRODUCTS: PremiumProduct[] = [
  {
    id: 'p1',
    name: 'Weekly Spotlight',
    description: 'Dominate the home page for 7 full days. Reach half a million collectors instantly.',
    price: 19.99,
    category: 'Spotlight'
  },
  {
    id: 'p10',
    name: 'Custom 1-of-1 Theme',
    description: 'Get your own custom theme and layout 1 of 1 just for you. Our staff will contact you to build your unique storefront brand.',
    price: 149.99,
    category: 'Service'
  },
  {
    id: 'p2',
    name: 'Neon Syndicate Theme',
    description: 'A cyberpunk-luxe aesthetic with electric cyan glows and obsidian glass panels.',
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
    name: 'NES ORIGINAL THEME',
    description: 'Retro hardware aesthetic. Authentically modeled after the 1985 console with grey plastic tones, circular red A/B buttons, and blocky 8-bit UI elements.',
    price: 14.99,
    category: 'Utility'
  },
  {
    id: 'p7',
    name: 'Glitch Protocol Theme',
    description: 'Direct bypass. A high-intensity digital aesthetic with persistent noise and scanline protocols.',
    price: 9.99,
    category: 'Utility'
  },
  {
    id: 'p8',
    name: 'Void Shard Theme',
    description: 'The pinnacle of mystery. A fractured obsidian aesthetic with pulsing electric violet energy.',
    price: 9.99,
    category: 'Utility'
  },
  {
    id: 'p9',
    name: 'HACKED THEME',
    description: 'Unauthorized access granted. A deep-web terminal aesthetic with scrolling binary streams.',
    price: 14.99,
    category: 'Utility'
  }
];

export function isListingExpired(listing: Listing): boolean {
  if (!listing.expiresAt || listing.type !== 'Buy It Now') return false;
  const expirationDate = listing.expiresAt.toDate ? listing.expiresAt.toDate() : new Date(listing.expiresAt);
  return new Date() > expirationDate;
}
