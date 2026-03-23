
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Timer, ArrowRight, Zap, Trophy, Activity, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Giveaway } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GiveawayCardProps {
  giveaway: Giveaway;
  theme?: string;
}

export default function GiveawayCard({ giveaway, theme }: GiveawayCardProps) {
  const isActive = giveaway.status === 'Active';
  const isComicBook = theme === 'Comic Book Theme';
  const isNeonSyndicate = theme === 'Neon Syndicate Theme';
  const isUrban = theme === 'Urban Theme';
  const isGameTheme = theme === 'NES ORIGINAL THEME';
  const isGlitchProtocol = theme === 'Glitch Protocol Theme';
  const isVoidShard = theme === 'Void Shard Theme';
  const isHacked = theme === 'HACKED THEME';

  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    setImgSrc(giveaway.imageUrl?.trim() || '/defaultbroken.jpg');
  }, [giveaway.imageUrl]);

  return (
    <Link href={`/giveaways/${giveaway.id}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-500 border-none relative flex flex-col h-full",
        isComicBook && "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff] text-black dark:text-white",
        isNeonSyndicate && "bg-zinc-900 border border-cyan-500/20 rounded-none text-white shadow-[0_0_30px_rgba(34,211,238,0.1)]",
        isUrban && "bg-white dark:bg-zinc-900 border-[10px] border-zinc-950 dark:border-zinc-800 text-zinc-950 dark:text-white rounded-none shadow-[20px_20px_0px_#000] hover:translate-y-[-6px] hover:shadow-[30px_30px_0px_#000]",
        isGameTheme && "bg-[#eeeeee] dark:bg-zinc-800 border-[6px] border-black rounded-none text-black dark:text-white shadow-[10px_10px_0_0_#000] hover:translate-y-[-4px] hover:shadow-[14px_14px_0_0_#000] active:translate-y-1 active:shadow-[4px_4px_0_0_#000]",
        isGlitchProtocol && "bg-zinc-950 border-4 border-red-600 rounded-none text-white animate-crt",
        isVoidShard && "bg-zinc-950 border-2 border-violet-500/20 rounded-none text-white shadow-[0_0_40px_rgba(139,92,246,0.2)]",
        isHacked && "bg-black border-2 border-[#00FF41] rounded-none text-[#00FF41] font-mono",
        (!isComicBook && !isNeonSyndicate && !isUrban && !isGameTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "bg-zinc-900 text-white rounded-[2.5rem] shadow-lg hover:shadow-2xl"
      )}>
        <div className={cn(
          "absolute top-0 right-0 px-4 py-1.5 font-black text-[8px] uppercase tracking-[0.15em] shadow-2xl z-30 transition-all",
          isUrban && "bg-accent text-white rounded-none -mr-1 skew-x-[-15deg] translate-x-2",
          isHacked && "bg-[#00FF41] text-black rounded-none border-l-2 border-b-2 border-black -mr-1",
          isGlitchProtocol && "bg-red-600 text-white rounded-none border-l-2 border-b-2 border-black -mr-1 animate-rgb",
          isGameTheme && "bg-black text-white rounded-none border-l-[4px] border-b-[4px] border-black -mr-1 tracking-[0.2em] font-black",
          (!isComicBook && !isNeonSyndicate && !isUrban && !isGameTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "bg-slate-800 text-white rounded-bl-3xl border-l border-b border-white/10"
        )}>
          {isUrban ? 'MISSION_CONTRABAND' : isGameTheme ? 'PAK_DROP' : isGlitchProtocol ? 'SYSTEM_BREACH' : 'GIVEAWAY'}
        </div>

        <div className={cn(
          "relative aspect-[16/10] overflow-hidden bg-zinc-950 flex items-center justify-center",
          isUrban && "border-b-[10px] border-zinc-950 dark:border-zinc-800",
          isHacked && "border-b-2 border-[#00FF41]/30",
          isGlitchProtocol && "border-b-2 border-red-600/30",
          isGameTheme && "border-b-[6px] border-black"
        )}>
          <Image 
            src={imgSrc} 
            alt={giveaway.title}
            fill
            onError={() => setImgSrc('/defaultbroken.jpg')}
            className={cn(
              "object-cover transition-transform duration-1000",
              isUrban && "grayscale brightness-[0.7] group-hover:brightness-100 group-hover:grayscale-0 contrast-125 scale-110",
              isHacked && "grayscale brightness-[0.7] group-hover:brightness-100",
              isGlitchProtocol && "scale-105 animate-crt contrast-150",
              isGameTheme && "grayscale-[0.2] group-hover:scale-110"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
          
          <Badge className={cn(
            "absolute top-4 left-4 border-none font-black shadow-2xl text-[9px] tracking-[0.2em] px-4 py-1.5 uppercase transition-all z-10 italic",
            isUrban ? "bg-white text-zinc-950 rounded-none skew-x-[-15deg] font-black border-2 border-zinc-950" :
            isHacked ? "bg-[#00FF41] text-black rounded-none" : 
            isGlitchProtocol ? "bg-white text-red-600 rounded-none animate-pulse" :
            isGameTheme ? "bg-black text-white rounded-none border border-white/20" :
            "bg-white text-zinc-950"
          )}>
            <Zap className="w-3.5 h-3.5 mr-2" /> {isUrban ? 'active_protocol' : isGameTheme ? 'LOAD_STAGE' : isGlitchProtocol ? 'INTERFERENCE' : 'LIVE DROP'}
          </Badge>
        </div>
        <CardContent className="p-6 md:p-8 flex-1 flex flex-col overflow-hidden">
          <div className="mb-4">
            <h3 className={cn(
              "font-headline text-lg md:text-2xl font-black line-clamp-1 leading-none uppercase px-4 py-3 block w-fit transition-all",
              isUrban && "bg-transparent text-zinc-950 dark:text-white lowercase tracking-tighter border-none p-0 text-4xl italic font-black",
              isHacked && "text-[#00FF41] font-mono border-l-4 border-[#00FF41] pl-4",
              isGlitchProtocol && "text-red-600 font-mono italic border-l-4 border-red-600 pl-4 animate-rgb",
              isGameTheme && "text-black dark:text-white tracking-[0.1em] border-l-[8px] border-red-600 pl-8 bg-black/5"
            )}>
              {giveaway.title}
            </h3>
          </div>
          <p className={cn(
            "text-xs md:sm line-clamp-2 mb-6 font-medium leading-relaxed transition-all",
            isUrban && "text-zinc-950 dark:text-zinc-400 font-black lowercase text-xl tracking-tight leading-[0.9] border-l-4 border-zinc-950 dark:border-white pl-4",
            isHacked && "text-[#00FF41]/60 font-mono italic",
            isGlitchProtocol && "text-white/60 font-mono italic animate-crt",
            isGameTheme && "text-black/70 dark:text-white/70 font-black uppercase tracking-[0.1em] text-[12px] leading-tight"
          )}>
            {giveaway.description}
          </p>
          <div className={cn(
            "w-full flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] p-5 rounded-none justify-center border transition-all mt-auto",
            isUrban && "bg-zinc-950 dark:bg-zinc-800 text-white border-none rounded-none font-black italic shadow-[6px_6px_0px_rgba(0,0,0,0.2)]",
            isHacked && "bg-[#00FF41]/5 text-[#00FF41] border-[#00FF41]/20",
            isGlitchProtocol && "bg-red-600/10 text-red-600 border-red-600/30 font-mono animate-crt",
            isGameTheme && "bg-black text-white border-black rounded-none",
            (!isComicBook && !isNeonSyndicate && !isUrban && !isGameTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "text-zinc-400 bg-zinc-950 border-zinc-800 rounded-2xl"
          )}>
            {isActive ? (
              <>
                {isUrban ? <Activity className="w-4 h-4 text-accent" /> : isGameTheme ? <Target className="w-4 h-4 text-red-600" /> : <Timer className="w-4 h-4" />}
                {isUrban ? 'transmitting_live' : isGameTheme ? 'AWAIT_SELECT_BUTTON' : isGlitchProtocol ? 'UPLINK_STABLE' : 'Drawing Soon'}
              </>
            ) : (
              <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> HIGH_SCORE_LOGGED</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-8 pt-0 md:px-8">
          <Button className={cn(
            "w-full font-black h-16 md:h-24 transition-all text-xs md:text-sm uppercase tracking-[0.4em]",
            isUrban && "bg-accent text-white rounded-none border-none shadow-[10px_10px_0px_rgba(0,0,0,0.2)] hover:bg-zinc-950 hover:shadow-[15px_15px_0px_rgba(0,0,0,0.3)] text-xl italic font-black",
            isHacked && "bg-black text-[#00FF41] border-2 border-[#00FF41] rounded-none hover:bg-[#00FF41] hover:text-black shadow-[0_0_20px_#00FF41]",
            isGlitchProtocol && "bg-red-600 text-white border-none rounded-none hover:bg-white hover:text-red-600 font-mono shadow-[0_0_25px_#ef4444] animate-rgb",
            isGameTheme ? "bg-[#ff0000] text-white rounded-full border-none shadow-[0_8px_0_0_#a00000] hover:translate-y-[-2px] hover:shadow-[0_10px_0_0_#a00000] active:translate-y-1 active:shadow-[0_4px_0_0_#a00000] text-2xl font-black" :
            (!isComicBook && !isNeonSyndicate && !isUrban && !isGameTheme && !isGlitchProtocol && !isVoidShard && !isHacked) && "bg-white text-zinc-950 hover:bg-zinc-200 shadow-2xl rounded-2xl"
          )}>
            {isUrban ? 'infiltrate_drop' : isGameTheme ? 'PRESS_A' : 'Play to Win'} <ArrowRight className="w-6 h-6 ml-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
