
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { rateLimit, createRateLimitResponse, getRateLimitForPath } from '@/lib/rate-limit';

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

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitValue = getRateLimitForPath('/api/search');
  const rateLimitResult = rateLimit(request, rateLimitValue);

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Query parameters
    const search = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : 0;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : 999999999;
    const condition = searchParams.get('condition') || '';
    const sortBy = searchParams.get('sort') || 'newest';
    const pageSize = 20;

    const db = getFirestore(app);
    const listingsRef = collection(db, 'listings');

    // Firestore Rule: If using a range filter, the first orderBy must be on the same field.
    // Query: status == Active AND price >= min AND price <= max
    const constraints: any[] = [
      where('status', '==', 'Active'),
      where('price', '>=', minPrice),
      where('price', '<=', maxPrice),
    ];

    if (category) {
      constraints.push(where('category', '==', category));
    }

    if (condition) {
      constraints.push(where('condition', '==', condition));
    }

    // Determine orderBy constraints to respect Firestore range filtering rules
    let orderByConstraint: any[] = [];
    
    // Since 'price' is used in a range filter, it MUST be the first orderBy field
    orderByConstraint.push(orderBy('price', sortBy === 'price-high' ? 'desc' : 'asc'));
    
    if (sortBy === 'newest') {
      orderByConstraint.push(orderBy('createdAt', 'desc'));
    }

    // Execute query
    const q = query(listingsRef, ...constraints, ...orderByConstraint, limit(pageSize + 1));
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        price: data.price,
        condition: data.condition,
        category: data.category,
        imageUrl: data.imageUrl,
        seller: data.sellerName || data.seller,
        type: data.type,
        currentBid: data.currentBid,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        description: data.description,
        tags: data.tags || [],
      };
    });

    // Filter by search term locally for title/description (full-text search simulation)
    if (search) {
      results = results.filter(
        (item: any) =>
          item.title.toLowerCase().includes(search) ||
          (item.description?.toLowerCase() || '').includes(search) ||
          item.tags.some((t: string) => t.toLowerCase().includes(search))
      );
    }

    // Check if there are more results
    const hasMore = results.length > pageSize;
    results = results.slice(0, pageSize);

    return NextResponse.json({
      results,
      hasMore,
      pageSize,
      total: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search listings' },
      { status: 500 }
    );
  }
}
