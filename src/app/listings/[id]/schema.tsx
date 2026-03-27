'use server';

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

import type { FirebaseApp } from 'firebase/app';
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  app = getApps()[0];
}

export async function ListingSchema({ listingId }: { listingId: string }) {
  try {
    const db = getFirestore(app);
    const listingRef = doc(db, 'listings', listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      return null;
    }

    const listing = listingSnap.data();
    const currentPrice = listing.type === 'Auction' ? (listing.currentBid || listing.price) : listing.price;
    const imageUrl = listing.imageUrl?.trim() || '/hobbydork-main.png';

    const schema = {
      '@context': 'https://schema.org/',
      '@type': listing.type === 'Auction' ? 'Offer' : 'Product',
      name: listing.title,
      description: listing.description || listing.title,
      image: imageUrl,
      sku: listingId,
      category: listing.category,
      ...(listing.condition && { 
        condition: 'https://schema.org/UsedCondition'
      }),
      // Grading fields removed
      offers: {
        '@type': 'Offer',
        url: `https://hobbydork.com/listings/${listingId}`,
        priceCurrency: 'USD',
        price: currentPrice.toString(),
        availability: listing.status === 'Active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: listing.sellerName || listing.seller,
        },
      },
      ...(listing.type === 'Auction' && {
        auctionStatus: listing.status === 'Ended' ? 'ended' : 'active',
        bidCount: listing.bidCount || 0,
      }),
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  } catch (error) {
    console.error('Error generating schema:', error);
    return null;
  }
}
