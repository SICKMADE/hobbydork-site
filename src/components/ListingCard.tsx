
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Listing, isListingExpired } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ListingCardProps {
  listing: Listing;
  theme?: string;
}

/**
 * SignRivets Component - Industrial mounting hardware for the Urban theme
 */
function SignRivets() {
  return (
    <>
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
    </>
  );
}

export default function ListingCard({ listing, theme }: ListingCardProps) {
  if (!listing) return null;

  const isAuction = listing.type === 'Auction';
  const appliedTheme = theme || 'Default';
  const isComicBook = appliedTheme === 'Comic Book Theme';
  const isNeonSyndicate = appliedTheme === 'Neon Syndicate Theme';
  const isUrban = appliedTheme === 'Urban Theme';
  const is8BitTheme = appliedTheme === '8-BIT ARCADE THEME';
  const isGlitchProtocol = appliedTheme === 'Glitch Protocol Theme';
  const isVoidShard = appliedTheme === 'Void Shard Theme';
  const isHacked = appliedTheme === 'HACKED THEME';

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
    const url = listing.imageUrl?.trim();
    setImgSrc(url && url.length > 0 ? url : '/defaultbroken.jpg');
  }, [listing.imageUrl]);

  const price = (listing.currentBid || listing.price || 0).toLocaleString();
  const seller = listing.seller || 'Collector';

  return (
    <Link href={`/listings/${listing.id}`} title={`View ${listing.title}`} className="block h-full group">
      <Card className={cn(
        "transition-all duration-500 border-none h-full flex flex-col p-1 relative",
        isComicBook && "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] text-black dark:text-white group-hover:translate-y-[-6px] group-hover:shadow-[12px_12px_0px_0px_#000]",
        isNeonSyndicate && "bg-zinc-900 border-2 border-cyan-500/40 rounded-none text-white shadow-[0_0_25px_rgba(34,211,238,0.2)] group-hover:border-cyan-400 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] overflow-hidden",
        isUrban && "bg-white border-[4px] border-zinc-200 rounded-none text-black shadow-2xl group-hover:translate-y-[-4px]",
        is8BitTheme && "bg-[#0a0a1a] border-4 border-black shadow-[10px_10px_0_0_#000] text-white rounded-none group-hover:translate-y-[-4px] overflow-hidden",
        isGlitchProtocol && "bg-zinc-800 border-[6px] border-red-600 rounded-none text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] group-hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] overflow-hidden",
        isVoidShard && "bg-zinc-900 border-2 border-violet-500/30 rounded-none text-white shadow-[0_0_20px_rgba(139,92,246,0.1)] group-hover:border-violet-500/60 group-hover:shadow-[0_0_30_rgba(139,92,246,0.3)] overflow-hidden",
        isHacked && "bg-black border-2 border-[#00FF41] rounded-none text-[#00FF41] font-mono group-hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] overflow-hidden",
        (!isComicBook && !isNeonSyndicate && !isUrban && !is8BitTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "bg-white dark:bg-zinc-800 rounded-2xl shadow-xl hover:shadow-2xl border-2 border-zinc-100 dark:border-white/5 overflow-hidden",
        (isEnded || listing.status === 'Sold') && "opacity-80 grayscale-[0.5]"
      )}>
        {isUrban && <SignRivets />}
        <div className={cn(
          "relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-lg",
          (isUrban || is8BitTheme || isGlitchProtocol || isVoidShard || isHacked || isComicBook) && "rounded-none border-b-4",
          isComicBook && "border-black",
          isUrban && "border-zinc-200",
          isHacked && "border-[#00FF41]/40",
          isGlitchProtocol && "border-red-600/40",
          is8BitTheme && "border-black"
        )}>
          {imgSrc && (
            <Image 
              src={imgSrc} 
              alt={listing.title}
              fill
              data-ai-hint="premium collectibles"
              onError={() => setImgSrc('/defaultbroken.jpg')}
              className={cn(
                "object-cover transition-transform duration-1000 group-hover:scale-110",
                isUrban && "contrast-110 brightness-100",
                isHacked && "brightness-[0.7]",
                isGlitchProtocol && "scale-105 contrast-125",
                is8BitTheme && "contrast-125 brightness-[0.8]",
                isVoidShard && "brightness-[0.8] contrast-110 group-hover:brightness-100"
              )}
            />
          )}
          
          <Badge className={cn(
            "absolute top-2 left-2 text-[8px] md:text-[10px] uppercase font-black px-3 py-1 border-none shadow-2xl z-20 italic",
            isUrban ? "bg-black text-white rounded-none tracking-widest" :
            isHacked ? "bg-[#00FF41] text-black rounded-none" : 
            is8BitTheme ? "bg-[#00f0ff] text-black rounded-none shadow-[2px_2px_0_0_#000]" :
            isGlitchProtocol ? "bg-white text-red-600 rounded-none animate-pulse" :
            isComicBook ? "bg-yellow-400 text-black border-2 border-black rounded-none shadow-[3px_3px_0px_#000]" :
            "bg-primary text-zinc-900 dark:text-zinc-200"
          )}>
            {listing.category}
          </Badge>

          {isAuction && (
            <Badge className={cn(
              "absolute top-2 right-2 text-[8px] md:text-[10px] font-black px-3 py-1 border-none shadow-2xl uppercase z-20",
              isUrban ? "bg-red-600 text-white rounded-none" :
              isHacked ? "bg-red-600 text-white rounded-none" : 
              is8BitTheme ? "bg-[#ff2e88] text-white rounded-none shadow-[2px_2px_0_0_#000]" :
              isGlitchProtocol ? "bg-red-600 text-white rounded-none" :
              "bg-red-600 text-white"
            )}>
              {is8BitTheme ? 'LIVE' : 'AUCTION'}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 flex-1 flex flex-col relative z-10 overflow-hidden text-center">
          {is8BitTheme && (
            <div className="text-[7px] font-black text-[#ff2e88] uppercase tracking-widest mb-1">LVL_01 // ASSET</div>
          )}
          <h3 className={cn(
            "font-headline font-black line-clamp-1 leading-tight uppercase text-sm md:text-base mb-2",
            isUrban && "font-black tracking-tight text-xl leading-[0.9] text-black",
            is8BitTheme && "text-white tracking-[0.05em] drop-shadow-[2px_2px_0_0_#000]",
            isHacked && "font-mono text-[#00FF41] tracking-tighter",
            isGlitchProtocol && "text-red-600 italic font-mono animate-glitch-text",
            isComicBook && "text-black dark:text-white text-lg italic",
            isNeonSyndicate && "text-white",
            isVoidShard && "text-white"
          )}>
            {listing.title}
          </h3>
          
          <div className="flex items-center justify-center gap-1 mb-4">
            <span className={cn(
              "text-[10px] md:text-xs font-black uppercase text-muted-foreground truncate",
              isUrban && "text-zinc-600 font-black tracking-widest",
              is8BitTheme && "text-[#00f0ff] font-bold",
              isHacked && "text-[#00FF41]/40 font-mono",
              isGlitchProtocol && "text-white/40 font-mono",
              isNeonSyndicate && "text-cyan-400/60",
              isVoidShard && "text-violet-400/60"
            )}>@{seller}</span>
          </div>

          <div className={cn(
            "mt-auto flex flex-col gap-4 border-t border-solid pt-4",
            isHacked ? "border-[#00FF41]/20" : 
            isGlitchProtocol ? "border-red-600/40" :
            isNeonSyndicate ? "border-cyan-500/20" :
            is8BitTheme ? "border-black" :
            isUrban ? "border-zinc-200" :
            "border-zinc-100 dark:border-white/10"
          )}>
            <div className="flex justify-between items-end">
              <div className="space-y-0 text-left">
                <p className={cn("text-[8px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest", is8BitTheme && "text-[#ff2e88]")}>
                  {is8BitTheme ? 'SCORE' : 'VALUE'}
                </p>
                <p className={cn(
                  "text-lg md:text-2xl font-black", 
                  isUrban && "text-black font-black text-2xl md:text-3xl leading-none border-l-[8px] border-red-600 pl-2 mt-1",
                  is8BitTheme && "text-white bg-black px-3 py-1 text-xl md:text-2xl tracking-tighter border-2 border-white/10",
                  isHacked && "text-[#00FF41] font-mono text-xl md:text-2xl",
                  isGlitchProtocol && "text-white bg-red-600 px-3 py-1 font-mono text-base md:text-xl shadow-[0_0_15px_red]",
                  isComicBook && "text-black dark:text-white text-2xl md:text-3xl italic bg-yellow-400 dark:bg-yellow-500 px-3 border-2 border-black shadow-[4px_4px_0px_#000] rotate-[-1deg] w-fit",
                  isNeonSyndicate && "text-white",
                  isVoidShard && "text-white"
                )}>${price}</p>
              </div>
              
              {isAuction && !isEnded && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[9px] font-black uppercase bg-muted/50 dark:bg-zinc-900/50 px-3 py-1 rounded-full",
                  isNeonSyndicate ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/20" : 
                  is8BitTheme ? "text-white bg-[#ff2e88] rounded-none shadow-[2px_2px_0_0_#000]" :
                  isUrban ? "text-red-600 bg-red-600/5 border border-red-600/20 rounded-none italic" :
                  isGlitchProtocol ? "text-red-600 bg-white" :
                  isHacked ? "text-[#00FF41] bg-black border border-[#00FF41]/20" :
                  "text-muted-foreground"
                )}>
                  <Clock className="w-3 h-3" />
                  {timeLeft}
                </div>
              )}
            </div>

            {is8BitTheme && (
              <Button className="w-full bg-[#ff2e88] hover:bg-[#ff2e88]/90 text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-none shadow-[4px_4px_0_0_#000] group-hover:translate-y-[-2px] transition-all">
                PRESS START <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
