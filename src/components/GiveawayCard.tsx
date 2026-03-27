
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Giveaway } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GiveawayCardProps {
  giveaway: Giveaway;
  theme?: string;
}

/**
 * SignRivets Component - Industrial mounting hardware for the Urban theme
 */
function SignRivets() {
  return (
    <>
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
    </>
  );
}

export default function GiveawayCard({ giveaway, theme }: GiveawayCardProps) {
  const appliedTheme = theme || 'Default';
  const isComicBook = appliedTheme === 'Comic Book Theme';
  const isNeonSyndicate = appliedTheme === 'Neon Syndicate Theme';
  const isUrban = appliedTheme === 'Urban Theme';
  const is8BitTheme = appliedTheme === '8-BIT ARCADE THEME';
  const isGlitchProtocol = appliedTheme === 'Glitch Protocol Theme';
  const isVoidShard = appliedTheme === 'Void Shard Theme';
  const isHacked = appliedTheme === 'HACKED THEME';

  const [imgSrc, setImgSrc] = useState<string>(giveaway.imageUrl?.trim() || '/defaultbroken.jpg');

  useEffect(() => {
    if (giveaway.imageUrl?.trim()) {
      setImgSrc(giveaway.imageUrl.trim());
    } else {
      setImgSrc('/defaultbroken.jpg');
    }
  }, [giveaway.imageUrl]);

  return (
    <Link href={`/giveaways/${giveaway.id}`} className="group block w-full">
      <Card className={cn(
        "transition-all duration-500 relative flex flex-col md:flex-row items-center gap-4 md:gap-8 p-4 md:p-6 shadow-2xl group-hover:translate-y-[-2px]",
        isComicBook && "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[10px_10px_0px_#000] dark:shadow-[10px_10px_0px_#fff] text-black dark:text-white overflow-hidden",
        isNeonSyndicate && "bg-zinc-900 border border-cyan-500/30 rounded-none text-white shadow-[0_0_40px_rgba(34,211,238,0.1)] overflow-hidden",
        isUrban && "bg-white border-[4px] border-zinc-200 rounded-none text-black shadow-2xl",
        is8BitTheme && "bg-[#0a0a1a] border-4 border-black shadow-[10px_10px_0_0_#000] text-white rounded-none group-hover:translate-y-[-4px] overflow-hidden",
        isGlitchProtocol && "bg-zinc-800 border-[6px] border-red-600 rounded-none text-white shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden",
        isVoidShard && "bg-zinc-900 border-2 border-violet-500/20 rounded-none text-white shadow-[0_0_40px_rgba(139,92,246,0.2)] overflow-hidden",
        isHacked && "bg-black border-2 border-[#00FF41] rounded-none text-[#00FF41] font-mono overflow-hidden",
        (!isComicBook && !isNeonSyndicate && !isUrban && !is8BitTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "bg-card text-card-foreground border rounded-[2.5rem] overflow-hidden"
      )}>
        {isUrban && <SignRivets />}
        {/* Left Side: Asset Module */}
        <div className={cn(
          "relative w-24 h-24 md:w-32 md:h-32 shrink-0 overflow-hidden bg-zinc-950 flex items-center justify-center rounded-2xl md:rounded-[2rem] shadow-xl z-10",
          isComicBook && "border-4 border-black rounded-none",
          isUrban && "border-[6px] border-zinc-100 rounded-none",
          is8BitTheme && "border-4 border-black shadow-[4px_4px_0_0_#000] rounded-none",
          isGlitchProtocol && "border-4 border-red-600 rounded-none",
          isHacked && "border-2 border-[#00FF41] rounded-none",
          isNeonSyndicate && "border-2 border-cyan-400 shadow-[0_0_20px_cyan]",
          isVoidShard && "border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
        )}>
          <Image 
            src={imgSrc} 
            alt={giveaway.title} 
            fill 
            className={cn(
              "object-cover transition-transform duration-700 group-hover:scale-110",
              isHacked && "brightness-[0.7]",
              isGlitchProtocol && "contrast-125",
              is8BitTheme && "contrast-125",
              isVoidShard && "brightness-110 contrast-110",
              isUrban && "contrast-110 brightness-100"
            )} 
            onError={() => setImgSrc('/defaultbroken.jpg')}
          />
          <div className="absolute inset-0 bg-black/10 transition-colors" />
          <div className="absolute bottom-2 right-2">
             <Zap className={cn("w-5 h-5", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : is8BitTheme ? "text-[#ff2e88]" : "text-accent")} />
          </div>
        </div>

        {/* Middle: Data Manifest */}
        <div className="flex-1 space-y-2 md:space-y-3 text-center md:text-left min-w-0">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
            <Badge className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border-none shadow-lg italic",
              isComicBook ? "bg-yellow-400 text-black border-2 border-black rounded-none rotate-[-1deg]" :
              isGlitchProtocol ? "bg-red-600 text-white rounded-none" :
              isNeonSyndicate ? "bg-cyan-400 text-black rounded-none" :
              is8BitTheme ? "bg-[#ff2e88] text-white rounded-none shadow-[2px_2px_0_0_#000]" :
              isUrban ? "bg-red-600 text-white rounded-none" :
              "bg-accent text-white"
            )}>
              {is8BitTheme ? 'BOSS DROP' : isGlitchProtocol ? 'SIGNAL_ACTIVE' : 'LIVE DROP'}
            </Badge>
            <div className={cn(
              "flex items-center gap-2 text-[9px] font-black uppercase tracking-widest",
              isHacked ? "text-[#00FF41]/60 font-mono" : 
              is8BitTheme ? "text-[#00f0ff] font-bold" :
              isUrban ? "text-zinc-500 font-black" :
              isNeonSyndicate ? "text-cyan-400/60" :
              isGlitchProtocol ? "text-red-600/60" :
              "text-muted-foreground dark:text-white/40"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {giveaway.entriesCount.toLocaleString()} {is8BitTheme ? 'PLAYERS_JOINED' : 'TICKETS_SECURED'}
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className={cn(
              "text-2xl md:text-4xl font-headline font-black uppercase italic tracking-tighter leading-none truncate",
              isHacked ? "text-[#00FF41] font-mono" : 
              isNeonSyndicate ? "text-white drop-shadow-[0_0_15px_cyan]" :
              isGlitchProtocol ? "text-red-600" :
              is8BitTheme ? "text-white drop-shadow-[4px_4px_0_0_#000]" :
              isUrban ? "text-black" :
              "text-primary dark:text-white"
            )}>
              {giveaway.title}
            </h3>
            <p className={cn(
              "text-sm md:text-base font-medium italic line-clamp-1 opacity-80",
              isHacked ? "text-[#00FF41]/80 font-mono" : 
              isGlitchProtocol ? "text-white/70 font-mono" :
              is8BitTheme ? "text-zinc-300 font-bold" :
              isUrban ? "text-zinc-600 font-bold uppercase tracking-tight" :
              isNeonSyndicate ? "text-white/60" :
              isVoidShard ? "text-white/60" :
              "text-muted-foreground dark:text-white/60"
            )}>
              {giveaway.description}
            </p>
          </div>
        </div>

        {/* Right Side: Command Module */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-4 shrink-0 pt-4 md:pt-0 relative z-10">
          <Button className={cn(
            "h-14 md:h-16 px-10 md:px-12 font-black uppercase text-xs md:text-sm tracking-[0.3em] shadow-2xl w-full md:w-auto transition-all active:scale-95 group/btn",
            isComicBook ? "bg-yellow-400 text-black border-[3px] border-black rounded-none shadow-[6px_6px_0px_#000] hover:translate-y-[-2px]" :
            isNeonSyndicate ? "bg-cyan-400 text-black hover:bg-cyan-300 rounded-none italic" :
            isUrban ? "bg-black text-white rounded-none border-none shadow-xl hover:translate-y-[-2px]" :
            is8BitTheme ? "bg-[#ff2e88] text-white rounded-none shadow-[4px_4px_0_0_#000] border-none hover:translate-y-[-2px]" :
            isHacked ? "bg-[#00FF41] text-black rounded-none font-mono hover:shadow-[0_0_20px_#00FF41]" :
            isGlitchProtocol ? "bg-red-600 text-white border-none rounded-none italic shadow-[0_0_20px_#ef4444] dark:bg-zinc-900 dark:text-red-500 hover:bg-red-700 hover:text-white" :
            "bg-primary text-white rounded-2xl",
            // fallback for any theme: always visible in dark mode
            "dark:bg-zinc-800 dark:text-white"
          )}>
            {is8BitTheme ? 'PRESS START' : isHacked ? 'EXEC_CLAIM' : 'Enter Giveaway'} 
            <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
          
          <div className={cn(
            "flex items-center gap-3 text-[9px] font-black uppercase tracking-widest",
            isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : is8BitTheme ? "text-[#ff2e88]" : isUrban ? "text-black" : "text-accent"
          )}>
            <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]", isNeonSyndicate ? "bg-cyan-400" : isGlitchProtocol ? "text-red-600" : "bg-red-600")} />
            {isGlitchProtocol ? 'UPLINK_STABLE' : is8BitTheme ? 'LVL_ACTIVE' : 'DROP_IN_PROGRESS'}
          </div>
        </div>

        {/* HUD Elements */}
        {(isGlitchProtocol || is8BitTheme || isUrban) && <div className="absolute inset-0 hardware-grid-overlay opacity-5 pointer-events-none" />}
        <div className={cn(
          "absolute top-2 right-2 text-[6px] font-black uppercase tracking-[0.5em] pointer-events-none",
          is8BitTheme ? "text-[#ff2e88]/40" : isHacked ? "text-[#00FF41]/40" : isUrban ? "text-black/40" : "text-white/20"
        )}>MDL_V2.4_BOUNTY</div>
      </Card>
    </Link>
  );
}
