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
import { Button } from '@/components/ui/button';
import { DigitalCountdownClock } from '@/components/blind-bidder/DigitalCountdownClock';

interface BlindBidderCardProps {
  auction: any;
  sellerName?: string;
  sellerAvatar?: string;
}

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function BlindBidderCard({ auction, sellerName, sellerAvatar }: BlindBidderCardProps) {
  const title: string = auction.title ?? 'Untitled auction';
  const description: string = auction.description ?? '';
  const category: string = auction.category ?? 'OTHER';
  // Use imageUrl if primaryImageUrl is not present
  const primaryImageUrl: string | undefined = auction.primaryImageUrl ?? auction.imageUrl ?? undefined;
  const sellerUid: string = auction.sellerUid ?? '';
  let endDate: Date | null = null;
  if (typeof auction.endsAt === 'object' && auction.endsAt !== null && 'seconds' in auction.endsAt) {
    endDate = new Date(auction.endsAt.seconds * 1000);
  } else if (typeof auction.endsAt === 'number') {
    endDate = new Date(auction.endsAt * 1000);
  }

  // Calculate if auction is ending soon (less than 1 hour left)
  let endingSoon = false;
  if (endDate) {
    const now = Date.now();
    const msLeft = endDate.getTime() - now;
    endingSoon = msLeft > 0 && msLeft < 60 * 60 * 1000;
  }

  return (
    <Card
      className="h-full flex flex-col overflow-hidden border-2 border-black bg-card/80 shadow-lg hover:shadow-2xl transition-all duration-200 group focus-within:ring-2 focus-within:ring-primary/70 focus-within:ring-offset-2 hover:-translate-y-1 hover:scale-[1.025] active:scale-[0.98] cursor-pointer"
      tabIndex={0}
      role="button"
      aria-label={`View auction: ${title}`}
    >
      <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center border-b-2 border-black group-hover:scale-[1.03] group-hover:shadow-xl transition-all duration-200">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 300px, 60vw"
            className="object-contain rounded-md drop-shadow-lg"
            priority={false}
          />
        ) : (
          <div className="text-xs text-muted-foreground px-4 text-center">
            No image
          </div>
        )}
      </div>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-blue-300 border-blue-400 text-blue-900 px-2 py-0.5 rounded-full shadow font-semibold tracking-wide uppercase">
            {category.replace('_', ' ')}
          </Badge>
          <Badge variant="default" className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-black px-2 py-0.5 rounded-full shadow font-bold tracking-wide">
            Auction
          </Badge>
          {endingSoon && (
            <Badge variant="default" className="bg-gradient-to-r from-red-400 to-red-600 text-white px-2 py-0.5 rounded-full shadow font-bold animate-pulse">
              Ending Soon
            </Badge>
          )}
        </div>
        <CardTitle className="text-base sm:text-lg leading-tight line-clamp-2 font-extrabold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex flex-col gap-1 text-xs">
        <div className="flex justify-center mb-2">
          {endDate ? <DigitalCountdownClock endTime={endDate} /> : <span>N/A</span>}
        </div>
        {/* No bid amount shown */}
        <CardDescription className="text-primary font-semibold text-sm mb-1 line-clamp-2">
          {description}
        </CardDescription>
        <div className="flex items-center gap-2 mt-2 mb-1">
          <Avatar className="w-6 h-6 border border-black">
            {sellerAvatar ? (
              <AvatarImage src={sellerAvatar} alt={sellerName ?? sellerUid ?? 'Seller'} />
            ) : (
              <AvatarFallback>{(sellerName || 'U').charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs font-semibold">{sellerName ?? 'Unknown Seller'}</span>
        </div>
        <Button asChild size="sm" className="w-full mt-2 comic-button group-hover:scale-105 transition-transform">
          <Link href={`/blind-bidder/${auction.id}`}>View & Bid</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
