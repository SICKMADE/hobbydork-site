
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';
import FollowButton from '@/components/FollowButton';

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
}

export default function ListingCard({ listing, compact = false }: ListingCardProps) {
  // Animation: fade/slide in on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Some older queries may use listingId instead of id
  const listingId: string | undefined = listing.id || listing.listingId;

  if (!listingId) return null;

  const title: string = listing.title ?? 'Untitled listing';
  const price: number = Number(listing.price ?? 0);
  const category: string = listing.category ?? 'OTHER';
  const condition: string = listing.condition ?? 'UNKNOWN';
  const quantityAvailable: number = Number(
    listing.quantityAvailable ?? 0,
  );
  const state: string = listing.state ?? 'ACTIVE';
  const primaryImageUrl: string | undefined = listing.primaryImageUrl ?? undefined;

  const isActive = state === 'ACTIVE';
  const isSoldOut = state === 'SOLD_OUT' || quantityAvailable <= 0;

  let stateLabel = 'Inventory';
  let stateVariant: 'default' | 'secondary' | 'outline' =
    'outline';

  if (isActive) {
    stateLabel = 'For sale';
    stateVariant = 'default';
  } else if (isSoldOut) {
    stateLabel = 'Sold out';
    stateVariant = 'secondary';
  } else if (state) {
    stateLabel = state.replace('_', ' ').toLowerCase();
  }

  const categoryIcons: Record<string, string> = {
    COMIC_BOOKS: '📚',
    SPORTS_CARDS: '🏅',
    POKEMON_CARDS: '⚡',
    VIDEO_GAMES: '🎮',
    TOYS: '🧸',
    OTHER: '✨',
    '': '🌐',
  };
  const categoryLabel = category.replace('_', ' ');
  const categoryIcon = categoryIcons[category] || '🌐';

  return (
    <div className={compact ? "w-full flex justify-center" : undefined}>
      <Link href={`/listings/${listingId}`} className="block w-full">
        <Card
          className={
            `h-full flex flex-col overflow-hidden transition-colors border-2 border-black bg-card/80 hover:bg-card shadow-sm relative ` +
            (compact ? 'p-2 text-xs w-full max-w-[170px] min-w-[120px] mx-auto' : '') +
            ` transition-transform duration-500 ease-out will-change-transform opacity-0 translate-y-6` +
            (mounted ? ' opacity-100 translate-y-0' : '')
          }
        >
          {/* Featured badge */}
          {listing.featured && (
            <span className="absolute top-2 left-2 z-10 bg-yellow-300 text-black font-bold px-3 py-1 rounded-full border-2 border-yellow-500 shadow text-xs animate-pulse">★ Featured</span>
          )}
          {/* Image section – fill container, smaller for compact */}
          <div className={compact ? "relative w-full aspect-[1/1] bg-muted flex items-center justify-center rounded" : "relative w-full aspect-[3/4] bg-muted flex items-center justify-center rounded"}>
            {primaryImageUrl ? (
              <Image
                src={primaryImageUrl}
                alt={title}
                fill
                sizes={compact ? "120px" : "(min-width: 1024px) 250px, 50vw"}
                className="object-contain"
              />
            ) : (
              <div className="text-xs text-muted-foreground px-4 text-center">
                No image
              </div>
            )}
          </div>

          <CardHeader className={compact ? "space-y-1 pb-1" : "space-y-2 pb-2"}>
            <div className="flex items-center gap-2 text-[10px]">
              <Badge variant="outline" className="rounded-md px-2 py-1 bg-zinc-800 text-white border-zinc-600 font-semibold tracking-wide shadow-sm">
                <span className="mr-1">{categoryIcon}</span>{categoryLabel}
              </Badge>
              <Badge variant={stateVariant} className={`rounded-md px-2 py-1 font-semibold tracking-wide shadow-sm ${stateVariant === 'default' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-zinc-700 text-white border-zinc-600'}`}>{stateLabel}</Badge>
              {/* Show views if >= 100 */}
              {typeof listing.views === 'number' && listing.views >= 100 && (
                <span className="ml-2 text-gray-500 flex items-center gap-1" title="Views">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4C5 4 1.73 8.11 1.13 8.93a1.5 1.5 0 0 0 0 2.14C1.73 11.89 5 16 10 16s8.27-4.11 8.87-4.93a1.5 1.5 0 0 0 0-2.14C18.27 8.11 15 4 10 4Zm0 10c-3.87 0-7.19-3.44-7.82-4.22a.5.5 0 0 1 0-.56C2.81 8.44 6.13 5 10 5s7.19 3.44 7.82 4.22a.5.5 0 0 1 0 .56C17.19 10.56 13.87 14 10 14Zm0-7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg>
                  {listing.views}
                </span>
              )}
            </div>
            <CardTitle className={compact ? "text-xs leading-tight line-clamp-2" : "text-sm sm:text-base leading-tight line-clamp-2"}>
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className={compact ? "pt-0 pb-2 flex flex-col gap-1 text-xs" : "pt-0 pb-3 flex flex-col gap-1 text-xs"}>
            <CardDescription className={compact ? "text-primary font-bold text-base" : "text-primary font-bold text-lg"}>
              ${price.toFixed(2)}
            </CardDescription>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>{condition.replace('_', ' ')}</span>
              <span>{quantityAvailable} available</span>
            </div>
          </CardContent>
            {/* Seller info and ratings */}
            <div className="flex items-center gap-2 mt-2">
              {listing.sellerAvatar ? (
                <Image src={listing.sellerAvatar} alt={listing.sellerName ?? 'Unknown Seller'} width={24} height={24} className="rounded-full border border-black" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 border border-black flex items-center justify-center text-xs">?</div>
              )}
              <span className="text-xs font-semibold flex items-center gap-1">
                {listing.sellerName ?? 'Unknown Seller'}
                {(() => {
                  const tier = (listing.sellerTier || 'BRONZE').toUpperCase();
                  let className = 'ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border shadow-inner';
                  let styleObj: React.CSSProperties | undefined = undefined;
                  if (tier === 'GOLD') {
                    styleObj = {
                      background: 'linear-gradient(90deg, #fffbe6 0%, #ffe066 40%, #ffd700 60%, #fffbe6 100%)',
                      color: '#a67c00',
                      borderColor: '#ffd700',
                      boxShadow: '0 1px 4px 0 #ffe06688, 0 0.5px 0 #fff inset',
                    };
                    className += ' border-yellow-400';
                  } else if (tier === 'SILVER') {
                    styleObj = {
                      background: 'linear-gradient(90deg, #f8f9fa 0%, #d1d5db 40%, #b0b4ba 60%, #f8f9fa 100%)',
                      color: '#555',
                      borderColor: '#b0b4ba',
                      boxShadow: '0 1px 4px 0 #b0b4ba88, 0 0.5px 0 #fff inset',
                    };
                    className += ' border-gray-400';
                  } else {
                    className += ' border-orange-400';
                    styleObj = undefined;
                  }
                  return <span className={className}>{tier} SELLER</span>;
                })()}
                {/* Follow button next to seller name */}
                {listing.sellerUid && (
                  <FollowButton targetUid={listing.sellerUid} className="ml-2" />
                )}
              </span>
              <span className="flex items-center gap-1 ml-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={i < Math.round(listing.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'} fill={i < Math.round(listing.rating ?? 0) ? 'currentColor' : 'none'} />
                ))}
              </span>
            </div>
        </Card>
      </Link>
    </div>
  );
}
