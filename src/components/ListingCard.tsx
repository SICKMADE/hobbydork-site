'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Tag, Zap, Package, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
  const isHobbyShop = theme === 'Hobby Shop Theme';

  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!isAuction || !listing.endsAt) return;

    const calculateTime = () => {
      const now = new Date();
      // Handle endsAt being either a Date or a Firestore Timestamp
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

  // Check if Buy It Now listing is expired
  useEffect(() => {
    if (!isAuction && listing.type === 'Buy It Now' && isListingExpired(listing)) {
      setIsEnded(true);
    }
  }, [isAuction, listing]);

  const price = (listing.currentBid || listing.price || 0).toLocaleString();
  const seller = listing.sellerName || listing.seller || 'Collector';
  
  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-500 border-none h-full flex flex-col p-2 rounded-lg",
        isComicBook && "bg-white border-[2px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black",
        isNeonSyndicate && "bg-zinc-900 border border-cyan-500/20 rounded-none shadow-[0_0_10px_rgba(34,211,238,0.05)] hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] text-white",
        isUrban && "bg-slate-100 border-[2px] border-slate-900 rounded-none shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-slate-950",
        isHobbyShop && "bg-white rounded-lg shadow-lg p-0 border-none ring-2 ring-white/20 overflow-hidden",
        (!isComicBook && !isNeonSyndicate && !isUrban && !isHobbyShop) && "bg-card rounded-lg shadow-sm hover:shadow-md",
        (isEnded || listing.status === 'Sold') && "opacity-80 grayscale-[0.5]"
      )}>
        {isHobbyShop && (
          <div className="bg-zinc-100 border-b border-zinc-200 p-3 flex justify-between items-center h-14">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] truncate pr-2">
              @{seller}
            </span>
            <div className="bg-white border-2 border-blue-600 px-3 py-1 rounded-lg text-blue-600 font-black text-xs shadow-sm">
              ${price}
            </div>
          </div>
        )}

        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {listing.imageUrl ? (
            <Image 
              src={listing.imageUrl} 
              alt={listing.title || 'Collectible'}
              fill
              className={cn(
                "object-cover transition-transform duration-1000",
                isNeonSyndicate ? "group-hover:scale-110 saturate-[0.8]" : "scale-100 group-hover:scale-110"
              )}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <Package className="w-12 h-12" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">No Image</span>
            </div>
          )}
          {!isHobbyShop && (
            <Badge className={cn(
              "absolute top-4 left-4 border-none font-black px-3 py-1 shadow-2xl text-[9px] uppercase tracking-widest z-10",
              isComicBook ? "bg-black text-white rounded-none border-2 border-white" : 
              isNeonSyndicate ? "bg-cyan-500 text-zinc-950 rounded-none italic" : 
              isUrban ? "bg-orange-600 text-white rounded-none skew-x-[-10deg]" : 
              "bg-background/90 text-foreground"
            )}>{listing.category || 'Collectible'}</Badge>
          )}
          {isAuction && !isHobbyShop && (
            <Badge className={cn(
              "absolute top-4 right-4 border-none font-black px-3 py-1 shadow-2xl text-[9px] uppercase tracking-widest z-10",
              isEnded ? "bg-zinc-500 text-white" : (isComicBook ? "bg-white text-black rounded-none border-2 border-black" : isNeonSyndicate ? "bg-zinc-100 text-zinc-950 rounded-none italic" : isUrban ? "bg-slate-900 text-white rounded-none" : "bg-primary text-white animate-pulse")
            )}>
              {isEnded ? <AlertCircle className="w-3 h-3 mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5" />}
              {isEnded ? "ENDED" : "AUCTION"}
            </Badge>
          )}
          {!isAuction && listing.type === 'Buy It Now' && !isHobbyShop && (
            <Badge className={cn(
              "absolute top-4 right-4 border-none font-black px-3 py-1 shadow-2xl text-[9px] uppercase tracking-widest z-10",
              isEnded ? "bg-zinc-500 text-white" : (isComicBook ? "bg-white text-black rounded-none border-2 border-black" : isNeonSyndicate ? "bg-zinc-100 text-zinc-950 rounded-none italic" : isUrban ? "bg-slate-900 text-white rounded-none" : "bg-green-600 text-white")
            )}>
              {isEnded ? <AlertCircle className="w-3 h-3 mr-1.5" /> : <Clock className="w-3 h-3 mr-1.5" />}
              {isEnded ? "EXPIRED" : "BUY NOW"}
            </Badge>
          )}
          {isNeonSyndicate && <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />}
          
          {(isEnded || listing.status === 'Sold') && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
              <Badge className="bg-zinc-900 text-white font-black px-6 py-2 rounded-none text-xl uppercase tracking-widest shadow-2xl scale-110">
                {listing.status === 'Sold' ? 'SOLD' : 'ENDED'}
              </Badge>
            </div>
          )}
        </div>
        
        {!isHobbyShop && (
          <CardContent className="p-2 flex-1 flex flex-col overflow-hidden">
            <div className="mb-1">
              <h3 className={cn(
                "font-headline text-base font-black line-clamp-1 leading-tight uppercase px-2 py-1 block w-fit transition-all",
                isComicBook && "text-black bg-yellow-400 border-2 border-black skew-x-[-6deg] drop-shadow-[2px_2px_0px_#ddd]",
                isNeonSyndicate && "text-white tracking-[0.2em] italic border-b border-cyan-500/30 pb-1 mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]",
                isUrban && "text-slate-950 bg-slate-200 border font-mono p-1 skew-y-1",
                (!isComicBook && !isNeonSyndicate && !isUrban) && "text-primary"
              )}>{listing.title || 'Untitled Item'}</h3>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2 font-bold">
              <Tag className={cn("w-3.5 h-3.5", isComicBook ? "text-black" : isNeonSyndicate ? "text-cyan-400" : isUrban ? "text-orange-600" : "text-primary")} />
              <span className={cn(isComicBook && "text-black font-black uppercase tracking-tighter", isNeonSyndicate && "text-cyan-400/60 italic tracking-wider", isUrban && "text-slate-600 font-mono uppercase")}>{seller}</span>
            </div>
            <div className="flex justify-between items-end mt-auto gap-1">
              <div className="space-y-0.5 flex-1">
                <p className={cn("text-[8px] uppercase font-black tracking-widest", isComicBook ? "text-black" : isNeonSyndicate ? "text-cyan-400/40" : isUrban ? "text-slate-500" : "text-zinc-500")}>{isAuction ? 'Current Bid' : 'Price'}</p>
                <p className={cn("text-lg md:text-xl font-black transition-all", isComicBook && "text-black text-xl skew-x-[-3deg] drop-shadow-[1px_1px_0px_#ddd]", isNeonSyndicate && "text-white text-2xl italic tracking-tighter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]", isUrban && "text-slate-950 font-mono text-xl", (!isComicBook && !isNeonSyndicate && !isUrban) && "text-primary")}>${price}</p>
              </div>
              {listing.isGraded && listing.gradingCompany && listing.gradingGrade && (
                <div className={cn("text-[8px] px-2 py-1 rounded text-center font-black uppercase tracking-widest flex flex-col items-center justify-center h-fit", isComicBook ? "bg-yellow-400 text-black border-2 border-black rounded-none" : isNeonSyndicate ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded-none" : isUrban ? "bg-orange-600 text-white border-2 border-orange-600 rounded-none" : "bg-accent/20 text-accent border border-accent/30")}>
                  <div className="leading-tight text-[7px]">{listing.gradingCompany}</div>
                  <div className="font-black text-[9px]">{listing.gradingGrade}</div>
                </div>
              )}
              {isAuction && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 uppercase tracking-widest transition-all",
                  isEnded ? "bg-zinc-100 text-zinc-400 border-zinc-200" : (isComicBook ? "bg-black text-white rounded-none border-2 border-white" : isNeonSyndicate ? "bg-cyan-500 text-zinc-950 rounded-none italic shadow-[0_0_15px_rgba(34,211,238,0.4)]" : isUrban ? "bg-orange-600 text-white rounded-none shadow-[4px_4px_0px_#000]" : "bg-primary/10 text-primary rounded-full")
                )}>
                  <Clock className="w-3.5 h-3.5" /><span>{timeLeft}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
        {!isHobbyShop && (
          <CardFooter className="px-6 pb-6 pt-0 gap-3 flex-wrap mt-auto">
            {listing.tags?.slice(0, 2).map(tag => (
              <span key={tag} className={cn("text-[9px] px-3 py-1 rounded-none font-black uppercase tracking-widest transition-all", isComicBook ? "bg-black text-white skew-x-[-8deg]" : isNeonSyndicate ? "bg-cyan-500/5 text-cyan-400/50 border border-cyan-500/20 hover:bg-cyan-500/10 italic" : isUrban ? "bg-slate-900 text-white font-mono skew-x-3" : "bg-secondary text-secondary-foreground rounded-full")}>#{tag}</span>
            ))}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
