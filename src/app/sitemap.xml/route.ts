import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

export async function GET() {
  try {
    const db = getFirestore(app);
    const listingsCollRef = collection(db, 'listings');
    const listingsSnap = await getDocs(listingsCollRef);

    const baseUrl = 'https://hobbydork.com';
    
    // Static pages
    const staticPages = [
      { url: baseUrl, priority: 1.0, changefreq: 'daily', lastmod: new Date().toISOString() },
      { url: `${baseUrl}/storefronts`, priority: 0.9, changefreq: 'daily', lastmod: new Date().toISOString() },
      { url: `${baseUrl}/dashboard`, priority: 0.8, changefreq: 'weekly', lastmod: new Date().toISOString() },
      { url: `${baseUrl}/giveaways`, priority: 0.8, changefreq: 'daily', lastmod: new Date().toISOString() },
      { url: `${baseUrl}/help`, priority: 0.7, changefreq: 'monthly', lastmod: new Date().toISOString() },
    ];

    // Dynamic listing pages
    const listingPages = listingsSnap.docs.map((doc) => {
      const listing = doc.data();
      return {
        url: `${baseUrl}/listings/${doc.id}`,
        lastmod: listing.createdAt?.toDate?.().toISOString?.() || new Date().toISOString(),
        priority: listing.status === 'Active' ? 0.9 : 0.6,
        changefreq: listing.type === 'Auction' ? 'hourly' : 'weekly',
      };
    });

    // Combine all pages
    const allPages = [...staticPages, ...listingPages];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
