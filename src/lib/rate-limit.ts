import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter (consider Redis in production)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMITS = {
  '/api/search': 30,
  '/api/createCheckoutSession': 5,
  '/api/createOrder': 5,
  '/api/stripe': 10,
  '/api/messages': 20,
  '/api/messages/send': 10,
  default: 100,
};

export function rateLimit(
  request: NextRequest,
  limit: number = 100
): { success: boolean; remaining: number; resetTime: number } {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();

  let record = rateLimits.get(ip);

  // Reset if window expired
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimits.set(ip, record);
  }

  record.count++;

  const remaining = Math.max(0, limit - record.count);
  const success = record.count <= limit;

  // Cleanup old entries
  if (rateLimits.size > 10000) {
    for (const [key, value] of rateLimits.entries()) {
      if (value.resetTime < now) {
        rateLimits.delete(key);
      }
    }
  }

  return {
    success,
    remaining,
    resetTime: record.resetTime,
  };
}

export function createRateLimitResponse(
  remaining: number,
  resetTime: number
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

export function getRateLimitForPath(path: string): number {
  for (const [route, limit] of Object.entries(RATE_LIMITS)) {
    if (route !== 'default' && path.startsWith(route)) {
      return limit;
    }
  }
  return RATE_LIMITS.default;
}
