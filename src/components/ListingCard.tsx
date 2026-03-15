'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Tag, Zap, AlertCircle, ShieldCheck, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Listing, isListingExpired } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ListingCardProps {
  listing: Listing;
  theme?: string;
}

import styles from './ListingCard.module.css';

function SprayDrip({ color = "white" }: { color?: string }) {
  // Map color to a CSS class
  const colorClass =
    color === 'white' ? styles.sprayWhite :
    color === 'black' ? styles.sprayBlack :
    color === 'accent' ? styles.sprayAccent :
    styles.sprayWhite;
  return (
    <div className={"absolute bottom-[-1px] left-0 right-0 flex justify-around items-start pointer-events-none z-30 px-6 translate-y-full h-8 " + colorClass}>
      <div className="flex flex-col items-center opacity-60 translate-x-[-15px]">
        <div className={styles.sprayDrip1} />
        <div className={styles.sprayDrip2} />
      </div>
      <div className="flex flex-col items-center opacity-30 mt-1 translate-x-4">
        <div className={styles.sprayDrip3} />
        <div className={styles.sprayDrip4} />
      </div>
      <div className="flex flex-col items-center opacity-50 mt-0.5 translate-x-12">
        <div className={styles.sprayDrip5} />
        <div className={styles.sprayDrip6} />
      </div>
    </div>
  );
}

export default function ListingCard({ listing, theme }: ListingCardProps) {
  if (!listing) return null;

  const isAuction = listing.type === 'Auction';
  const isComicBook = theme === 'Comic Book Theme';
  const isNeonSyndicate = theme === 'Neon Syndicate Theme';
  const isUrban = theme === 'Urban Theme';
  const isHobbyShop = theme === 'Hobby Shop Theme';

  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!isAuction || !listing.endsAt) return;

    const calculateTime = () => {
      const now = new Date();
      const endsAt = listing.endsAt.toDate ? listing.endsAt.toDate() : new Date(listing.endsAt);
      const diff = endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeft('ENDED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m remaining`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [isAuction, listing.endsAt]);

  useEffect(() => {
    if (!isAuction && listing.type === 'Buy It Now' && isListingExpired(listing)) {
      setIsEnded(true);
    }
  }, [isAuction, listing]);

  const price = (listing.currentBid || listing.price || 0).toLocaleString();
  const seller = listing.sellerName || listing.seller || 'Collector';
  
  // ALIGNED: strictly use listingSellerId as defined in backend blueprint
  const sellerUid = listing.listingSellerId;
  
  const defaultListingImage = PlaceHolderImages.find(img => img.id === 'default-listing')?.imageUrl || '/defaultbroken.jpg';
  const listingImageUrl = listing.imageUrl?.trim() || defaultListingImage;

  return (
    <Link href={`/listings/${listing.id}`} className="block h-full">
      <Card className={cn(
        "group transition-all duration-500 border-none h-full flex flex-col p-2 relative",
        isComicBook && "bg-white border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black",
        isNeonSyndicate && "bg-zinc-900 border border-cyan-500/20 rounded-none text-white",
        isUrban && "bg-black rounded-none text-white border-none overflow-visible",
        isHobbyShop && "bg-white rounded-[1.2rem] shadow-xl p-0",
        (!isComicBook && !isNeonSyndicate && !isUrban && !isHobbyShop) && "bg-card rounded-xl shadow-sm hover:shadow-lg overflow-hidden",
        (isEnded || listing.status === 'Sold') && "opacity-80 grayscale-[0.5]"
      )}>
        {isUrban && (
          <>
            <div className="absolute inset-0 border-2 border-white/90 rounded-none pointer-events-none z-20" />
            <SprayDrip />
          </>
        )}

        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 rounded-lg">
          <Image 
            src={listingImageUrl} 
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            data-ai-hint="listing photo"
          />
          
          <Badge className="absolute top-2 left-2 text-[7px] uppercase font-black px-1.5 py-0.5 border-none shadow-xl bg-background/90 text-foreground">
            {listing.category}
          </Badge>

          {isAuction && (
            <Badge className={cn(
              "absolute top-2 right-2 text-[7px] font-black px-1.5 py-0.5 border-none shadow-xl uppercase",
              isEnded ? "bg-zinc-500" : "bg-red-600 text-white animate-pulse"
            )}>
              <Zap className="w-2 h-2 mr-1" /> AUCTION
            </Badge>
          )}
        </div>
        
        <CardContent className="p-2 flex-1 flex flex-col relative z-10">
          <h3 className="font-headline font-black line-clamp-1 leading-tight uppercase text-xs sm:text-sm mb-1">
            {listing.title}
          </h3>
          
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[8px] font-black uppercase text-muted-foreground truncate">@{seller}</span>
            {listing.sellerTier && (
              <Badge className="h-3.5 px-1.5 text-[6px] font-black uppercase bg-accent text-white border-none">
                {listing.sellerTier}
              </Badge>
            )}
          </div>

          <div className="mt-auto flex justify-between items-end">
            <div className="space-y-0.5">
              <p className="text-[7px] uppercase font-black text-muted-foreground">{isAuction ? 'Bid' : 'Price'}</p>
              <p className="text-sm font-black">${price}</p>
            </div>
            {isAuction && !isEnded && (
              <div className="flex items-center gap-1 text-[7px] font-black px-1.5 py-0.5 uppercase bg-accent/10 text-accent rounded-full">
                <Clock className="w-2 h-2" /><span>{timeLeft}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}