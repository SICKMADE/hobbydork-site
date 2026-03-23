
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Listing, isListingExpired } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  theme?: string;
}

export default function ListingCard({ listing, theme }: ListingCardProps) {
  if (!listing) return null;

  const isAuction = listing.type === 'Auction';
  const isComicBook = theme === 'Comic Book Theme';
  const isNeonSyndicate = theme === 'Neon Syndicate Theme';
  const isUrban = theme === 'Urban Theme';
  const isGameTheme = theme === 'NES ORIGINAL THEME';
  const isGlitchProtocol = theme === 'Glitch Protocol Theme';
  const isVoidShard = theme === 'Void Shard Theme';
  const isHacked = theme === 'HACKED THEME';

  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');

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

  useEffect(() => {
    setImgSrc(listing.imageUrl?.trim() || '/defaultbroken.jpg');
  }, [listing.imageUrl]);

  const price = (listing.currentBid || listing.price || 0).toLocaleString();
  const seller = listing.sellerName || listing.seller || 'Collector';

  return (
    <Link href={`/listings/${listing.id}`} title={`View ${listing.title}`} className="block h-full">
      <Card className={cn(
        "group transition-all duration-500 border-none h-full flex flex-col p-1 md:p-1.5 relative",
        isComicBook && "bg-white dark:bg-zinc-900 border-[2px] border-black rounded-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-black dark:text-white",
        isNeonSyndicate && "bg-zinc-900 border border-cyan-500/20 rounded-none text-white",
        isUrban && "bg-white dark:bg-zinc-900 border-[4px] md:border-[6px] border-zinc-950 dark:border-zinc-800 rounded-none text-zinc-950 dark:text-white shadow-[6px_6px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-4px]",
        isGameTheme && "bg-[#eeeeee] dark:bg-zinc-800 border-[2px] md:border-[3px] border-black rounded-none text-black dark:text-white shadow-[3px_3px_0_0_#000]",
        isGlitchProtocol && "bg-zinc-950 border-2 border-red-600 rounded-none text-white animate-crt shadow-[0_0_15px_rgba(220,38,38,0.1)]",
        isVoidShard && "bg-zinc-950 border-2 border-violet-500/20 rounded-none text-white",
        isHacked && "bg-black border border-[#00FF41] rounded-none text-[#00FF41] font-mono",
        (!isComicBook && !isNeonSyndicate && !isUrban && !isGameTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "bg-zinc-50/80 dark:bg-zinc-800/60 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-lg overflow-hidden border border-border/50",
        (isEnded || listing.status === 'Sold') && "opacity-80 grayscale-[0.5]"
      )}>
        <div className={cn(
          "relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-md",
          (isUrban || isGameTheme || isGlitchProtocol || isVoidShard || isHacked) && "rounded-none border-b-2 border-white/10",
          isUrban && "border-b-[4px] md:border-b-[6px] border-zinc-950 dark:border-zinc-800",
          isHacked && "border-[#00FF41]/30",
          isGlitchProtocol && "border-red-600/30",
          isGameTheme && "border-black border-b-[2px] md:border-b-[3px]"
        )}>
          <Image 
            src={imgSrc} 
            alt={listing.title}
            fill
            data-ai-hint="premium collectibles"
            onError={() => setImgSrc('/defaultbroken.jpg')}
            className={cn(
              "object-cover transition-transform duration-1000 group-hover:scale-110",
              isUrban && "brightness-[0.9] group-hover:brightness-100 contrast-125",
              isHacked && "grayscale brightness-[0.7]",
              isGlitchProtocol && "scale-105 contrast-125 animate-crt",
              isGameTheme && "contrast-110"
            )}
          />
          
          <Badge className={cn(
            "absolute top-1 left-1 md:top-1.5 md:left-1.5 text-[5px] md:text-[6px] uppercase font-black px-1 py-0.5 border-none shadow-xl",
            isUrban ? "bg-zinc-950 text-white rounded-none tracking-[0.2em] skew-x-[-15deg]" :
            isHacked ? "bg-[#00FF41] text-black rounded-none" : 
            isGameTheme ? "bg-black text-white rounded-none tracking-[0.1em] font-black" :
            isGlitchProtocol ? "bg-white text-red-600 rounded-none animate-pulse" :
            "bg-background/90 dark:bg-zinc-950/90 text-foreground dark:text-white"
          )}>
            {listing.category}
          </Badge>

          {isAuction && (
            <Badge className={cn(
              "absolute top-1 right-1 md:top-1.5 md:right-1.5 text-[5px] md:text-[6px] font-black px-1 py-0.5 border-none shadow-xl uppercase",
              isUrban ? "bg-red-600 text-white rounded-none italic skew-x-[-15deg]" :
              isHacked ? "bg-red-600 text-white rounded-none" : 
              isGameTheme ? "bg-red-600 text-white rounded-none" :
              isGlitchProtocol ? "bg-red-600 text-white rounded-none animate-rgb" :
              "bg-red-600 text-white"
            )}>
              {isGameTheme ? 'LIVE' : 'AUCTION'}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-1 md:p-1.5 flex-1 flex flex-col relative z-10 overflow-hidden">
          <h3 className={cn(
            "font-headline font-black line-clamp-1 leading-tight uppercase text-[9px] md:text-[11px] mb-0.5",
            isUrban && "lowercase font-black tracking-tighter text-sm md:text-base leading-[0.9]",
            isGameTheme && "text-black dark:text-white tracking-[0.05em] font-black text-[10px] md:text-[12px]",
            isHacked && "font-mono text-[#00FF41] tracking-tighter",
            isGlitchProtocol && "text-red-600 italic font-mono animate-rgb"
          )}>
            {listing.title}
          </h3>
          
          <div className="flex items-center gap-1 mb-1">
            <span className={cn(
              "text-[6px] md:text-[7px] font-black uppercase text-muted-foreground truncate",
              isUrban && "text-zinc-400 dark:text-zinc-500 lowercase font-black tracking-widest",
              isGameTheme && "text-black/40 dark:text-white/40",
              isHacked && "text-[#00FF41]/40 font-mono",
              isGlitchProtocol && "text-white/40 font-mono"
            )}>@{seller}</span>
          </div>

          <div className="mt-auto flex justify-between items-end">
            <div className="space-y-0">
              <p className="text-[5px] md:text-[6px] uppercase font-black text-muted-foreground">Price</p>
              <p className={cn(
                "text-[10px] md:text-xs font-black", 
                isUrban && "text-zinc-950 dark:text-white font-black text-base md:text-xl leading-none border-l-[4px] md:border-l-[6px] border-accent pl-1.5 md:pl-2 mt-0.5",
                isGameTheme && "text-black dark:text-white bg-white dark:bg-zinc-950 border border-black dark:border-white/20 px-1 py-0.5 text-xs md:text-sm tracking-tighter font-black",
                isHacked && "text-[#00FF41] font-mono text-xs md:text-sm",
                isGlitchProtocol && "text-white bg-red-600 px-1 font-mono text-[10px] md:text-xs animate-rgb"
              )}>${price}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
