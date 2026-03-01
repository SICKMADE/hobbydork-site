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
  sellerName?: string;
  buyer?: string;
  status: 'Active' | 'Sold' | 'Ended';
  type: 'Auction' | 'Buy It Now';
  endsAt?: any; // Date or Timestamp
  currentBid?: number;
  bidCount?: number;
  tags: string[];
  createdAt: any;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  seller: string;
  sellerId?: string;
  sellerName?: string;
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

export const LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Vintage Rolex Submariner 5513',
    description: 'Beautifully aged patina, recently serviced. Rare meters first dial.',
    price: 12500,
    category: 'Watches',
    imageUrl: '',
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
    imageUrl: '',
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
    imageUrl: '',
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
    imageUrl: '',
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
    price: 69,
    category: 'Utility'
  },
  {
    id: 'p3',
    name: 'Urban Theme',
    description: 'Give your shop a gritty, industrial billboard look for that street-collector vibe.',
    price: 39,
    category: 'Utility'
  },
  {
    id: 'p4',
    name: 'Comic Book Theme',
    description: 'Gritty Noir aesthetic with newsprint halftone dots, heavy ink outlines, and 2D shadows.',
    price: 59,
    category: 'Utility'
  },
  {
    id: 'p5',
    name: 'Hobby Shop Theme',
    description: 'Capture the local retail vibe with Field Grass backgrounds and professional Graded Slab listings.',
    price: 49,
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
