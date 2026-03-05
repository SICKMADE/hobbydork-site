import type { Metadata } from 'next';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase (server-side)
import type { FirebaseApp } from 'firebase/app';
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  });
} else {
  app = getApps()[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const db = getFirestore(app);
    const listingRef = doc(db, 'listings', id);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      return {
        title: 'Listing Not Found | hobbydork',
        description: 'This listing is no longer available.',
      };
    }

    const listing = listingSnap.data();
    const conditionText = listing.condition ? ` (${listing.condition})` : '';
    const title = `${listing.title}${conditionText} - $${listing.price.toLocaleString()} | hobbydork`;
    const description = listing.description || `${listing.title} available on hobbydork marketplace for $${listing.price.toLocaleString()}.`;
    const imageUrl = listing.imageUrl?.trim() || '/hobbydork-main.png';
    const currentPrice = listing.type === 'Auction' ? (listing.currentBid || listing.price) : listing.price;

    const metadata: Metadata = {
      title,
      description: description.substring(0, 160),
      keywords: [
        listing.title,
        listing.category,
        listing.condition,
        'collectibles',
        'marketplace',
      ].filter(Boolean),
      openGraph: {
        type: 'article',
        title,
        description: description.substring(0, 160),
        url: `https://hobbydork.com/listings/${id}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: listing.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: description.substring(0, 160),
        images: [imageUrl],
      },
    };

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Loading Listing | hobbydork',
      description: 'Checking listing details...',
    };
  }
}
