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
}

export default function ListingCard({ listing }: ListingCardProps) {
  // Some older queries may use listingId instead of id
  const anyListing = listing as any;
  const listingId: string | undefined =
    anyListing.id || anyListing.listingId;

  if (!listingId) return null;

  const title: string = anyListing.title ?? 'Untitled listing';
  const price: number = Number(anyListing.price ?? 0);
  const category: string = anyListing.category ?? 'OTHER';
  const condition: string = anyListing.condition ?? 'UNKNOWN';
  const quantityAvailable: number = Number(
    anyListing.quantityAvailable ?? 0,
  );
  const state: string = anyListing.state ?? 'ACTIVE';
  const primaryImageUrl: string | undefined =
    anyListing.primaryImageUrl;

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
    <Link href={`/listings/${listingId}`} className="block">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image section – NOT zoomed in */}
        <div className="relative w-full aspect-[3/4] bg-muted flex items-center justify-center">
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={title}
              fill
              sizes="(min-width: 1024px) 250px, 50vw"
              className="object-contain"
            />
          ) : (
            <div className="text-xs text-muted-foreground px-4 text-center">
              No image
            </div>
          )}
        </div>

        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-2 text-[10px]">
            <Badge variant="outline">{categoryLabel}</Badge>
            <Badge variant={stateVariant}>{stateLabel}</Badge>
          </div>
          <CardTitle className="text-sm sm:text-base leading-tight line-clamp-2">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 pb-3 flex flex-col gap-1 text-xs">
          <CardDescription className="text-primary font-bold text-lg">
            ${price.toFixed(2)}
          </CardDescription>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>{condition.replace('_', ' ')}</span>
            <span>{quantityAvailable} available</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
