import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';
import Link from 'next/link';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="overflow-hidden transition-transform transform hover:scale-105 hover:shadow-primary/20 hover:shadow-lg h-full flex flex-col">
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
        <CardContent className="p-4 space-y-2 flex flex-col flex-grow">
          <Badge variant="secondary" className="text-xs w-fit">{listing.category}</Badge>
          <CardTitle className="text-lg leading-tight truncate">{listing.title}</CardTitle>
          <div className="flex-grow" />
          <CardDescription className="text-primary font-bold text-xl">
            ${listing.price.toFixed(2)}
          </CardDescription>
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
            <span>{listing.condition}</span>
            <span>{listing.quantity} available</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
