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
}

export default function BlindBidderCard({ auction }: BlindBidderCardProps) {
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

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-colors border-2 border-black bg-card/80 hover:bg-card shadow-sm">
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
          <Badge variant="outline">{category.replace('_', ' ')}</Badge>
          <Badge variant="default">Auction</Badge>
        </div>
        <CardTitle className="text-sm sm:text-base leading-tight line-clamp-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex flex-col gap-1 text-xs">
        <div className="flex justify-center mb-2">
          {endDate ? <DigitalCountdownClock endTime={endDate} /> : <span>N/A</span>}
        </div>
        <CardDescription className="text-primary font-bold text-base mb-1">
          {description}
        </CardDescription>
        <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-1">
          <span>Seller: {sellerUid}</span>
        </div>
        <Button asChild size="sm" className="w-full mt-2"><Link href={`/blind-bidder/${auction.id}`}>View & Bid</Link></Button>
      </CardContent>
    </Card>
  );
}
