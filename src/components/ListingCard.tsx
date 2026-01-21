
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
}

export default function ListingCard({ listing, compact = false }: ListingCardProps) {
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

  const categoryLabel = category.replace('_', ' ');

  return (
    <div className={compact ? "w-full flex justify-center" : undefined}>
      <Link href={`/listings/${listingId}`} className="block w-full">
        <Card
          className={
            `h-full flex flex-col overflow-hidden transition-colors border-2 border-black bg-card/80 hover:bg-card shadow-sm ` +
            (compact ? 'p-2 text-xs w-full max-w-[170px] min-w-[120px] mx-auto' : '')
          }
        >
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
              <Badge variant="outline" className="rounded-md px-2 py-1 bg-zinc-800 text-white border-zinc-600 font-semibold tracking-wide shadow-sm">{categoryLabel}</Badge>
              <Badge variant={stateVariant} className={`rounded-md px-2 py-1 font-semibold tracking-wide shadow-sm ${stateVariant === 'default' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-zinc-700 text-white border-zinc-600'}`}>{stateLabel}</Badge>
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
        </Card>
      </Link>
    </div>
  );
}
