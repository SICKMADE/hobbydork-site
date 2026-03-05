import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
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
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : 0;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : 999999999;
    const condition = searchParams.get('condition') || '';
    // Grading parameter removed
    const sortBy = searchParams.get('sort') || 'newest'; // newest, price-low, price-high, trending
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;

    const db = getFirestore(app);
    const listingsRef = collection(db, 'listings');

    // Build query constraints
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

    // Grading constraint removed

    // Sort
    let orderByConstraint: any[] = [];
    switch (sortBy) {
      case 'price-low':
        orderByConstraint = [orderBy('price', 'asc')];
        break;
      case 'price-high':
        orderByConstraint = [orderBy('price', 'desc')];
        break;
      case 'trending':
        orderByConstraint = [orderBy('viewCount', 'desc')];
        break;
      case 'newest':
      default:
        orderByConstraint = [orderBy('createdAt', 'desc')];
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
      };
    });

    // Filter by search term (title + description)
    if (search) {
      results = results.filter(
        (item: any) =>
          item.title.toLowerCase().includes(search) ||
          (item.description?.toLowerCase() || '').includes(search)
      );
    }

    // Check if there are more results
    const hasMore = results.length > pageSize;
    results = results.slice(0, pageSize);

    return NextResponse.json({
      results,
      hasMore,
      page,
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
