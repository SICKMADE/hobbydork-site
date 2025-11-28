import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="overflow-hidden transition-transform transform hover:scale-105 hover:shadow-primary/20 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover"
            data-ai-hint="collectible item"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
        <CardTitle className="text-lg leading-tight truncate">{listing.title}</CardTitle>
        <CardDescription className="text-primary font-bold text-xl">
          ${listing.price.toFixed(2)}
        </CardDescription>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{listing.condition}</span>
          <span>{listing.quantity} available</span>
        </div>
      </CardContent>
    </Card>
  );
}
