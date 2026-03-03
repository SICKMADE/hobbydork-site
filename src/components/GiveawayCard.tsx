'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Timer, Users, ArrowRight, Zap, Gift as GiftIcon } from 'lucide-react';
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
  const isHobbyShop = theme === 'Hobby Shop Theme';

  return (
    <Link href={`/giveaways/${giveaway.id}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-500 border-none relative flex flex-col h-full",
        isComicBook && "bg-white border-[4px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black",
        isNeonSyndicate && "bg-zinc-900 border border-cyan-500/20 rounded-none text-white shadow-[0_0_30px_rgba(34,211,238,0.1)]",
        isUrban && "bg-slate-900 border-4 border-slate-700 text-white rounded-none shadow-[10px_10px_0px_#000]",
        isHobbyShop && "bg-white border-2 border-zinc-200 shadow-xl text-zinc-900 taped-corner mx-2",
        (!isComicBook && !isNeonSyndicate && !isUrban && !isHobbyShop) && "bg-zinc-900 text-white rounded-[2.5rem] shadow-lg hover:shadow-2xl"
      )}>
        <div className={cn(
          "absolute top-0 right-0 px-4 py-1.5 font-black text-[8px] uppercase tracking-[0.15em] shadow-2xl z-30 transition-all",
          isComicBook && "bg-black text-white skew-x-[-15deg] -mr-3 mt-3 border-2 border-white",
          isNeonSyndicate && "bg-cyan-500 text-zinc-950 rounded-none italic border-l border-b border-cyan-500/50",
          isUrban && "bg-orange-600 text-white rounded-none border-b-4 border-l-4 border-slate-950",
          isHobbyShop && "bg-red-600 text-white rounded-none shadow-md rotate-3 -mr-2 mt-2",
          (!isComicBook && !isNeonSyndicate && !isUrban && !isHobbyShop) && "bg-slate-800 text-white rounded-bl-3xl border-l border-b border-white/10"
        )}>
          GIVEAWAY
        </div>

        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950 flex items-center justify-center">
          {giveaway.imageUrl ? (
            <Image 
              src={giveaway.imageUrl} 
              alt={giveaway.title}
              fill
              className={cn(
                "object-cover transition-transform duration-1000",
                isNeonSyndicate ? "group-hover:scale-110 saturate-[0.8]" : "scale-100 group-hover:scale-110"
              )}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/20">
              <GiftIcon className="w-16 h-16" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Mystery Prize</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
          <Badge className={cn(
            "absolute top-4 left-4 border-none font-black shadow-2xl text-[9px] tracking-[0.15em] px-3 py-1 uppercase transition-all z-10",
            isComicBook ? "bg-black text-white rounded-none border-2 border-white" : 
            isNeonSyndicate ? "bg-cyan-500 text-zinc-950 rounded-none italic" : 
            isUrban ? "bg-orange-600 text-white rounded-none skew-x-[-10deg]" : 
            isHobbyShop ? "bg-white text-zinc-900 rounded-none" : "bg-white text-zinc-950"
          )}>
            <Zap className="w-3 h-3 mr-2" /> LIVE DROP
          </Badge>
          <div className="absolute bottom-4 left-4 right-4 z-10">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Value</p>
                   <p className={cn(
                     "text-2xl font-black text-white transition-all",
                     isNeonSyndicate && "italic text-3xl text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]",
                     isUrban && "font-mono text-3xl text-orange-400"
                   )}>${giveaway.prizeValue.toLocaleString()}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-[10px] font-black bg-white/10 backdrop-blur-xl px-3 py-1.5 border border-white/20 transition-all",
                  isNeonSyndicate ? "rounded-none italic border-cyan-500/30" : isUrban ? "rounded-none border-slate-700 bg-slate-900" : "rounded-xl"
                )}>
                  <Users className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{giveaway.entriesCount}</span>
                </div>
             </div>
          </div>
        </div>
        <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
          <div className="mb-4">
            <h3 className={cn(
              "font-headline text-lg md:text-xl font-black line-clamp-1 leading-none uppercase px-4 py-2 block w-fit transition-all",
              isComicBook ? "text-black bg-yellow-400 border-[4px] border-black skew-x-[-6deg]" : 
              isNeonSyndicate ? "text-white italic tracking-[0.2em] border-l-4 border-cyan-500 pl-4 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" : 
              isUrban ? "text-white font-mono bg-slate-800 p-3 skew-y-1" : 
              isHobbyShop ? "text-[#5d4037] font-serif border-b-2 border-[#5d4037]" : "text-white"
            )}>
              {giveaway.title}
            </h3>
          </div>
          <p className={cn(
            "text-xs line-clamp-2 mb-6 font-medium leading-relaxed transition-all",
            isComicBook ? "text-black/80 font-black" : 
            isNeonSyndicate ? "text-cyan-400/60 italic tracking-wider" :
            isUrban ? "text-slate-400 font-mono" : 
            isHobbyShop ? "text-zinc-600 italic font-serif" : "text-zinc-400"
          )}>
            {giveaway.description}
          </p>
          <div className={cn(
            "w-full flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] p-3 rounded-none justify-center border transition-all mt-auto",
            isComicBook && "bg-black text-white border-none skew-x-[-6deg]",
            isNeonSyndicate && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 italic shadow-[0_0_10px_rgba(34,211,238,0.1)]",
            isUrban && "bg-orange-600 text-white border-slate-950 font-mono shadow-[4px_4px_0_#000]",
            isHobbyShop && "bg-zinc-100 text-zinc-600 border-zinc-200 rounded-none",
            (!isComicBook && !isNeonSyndicate && !isUrban && !isHobbyShop) && "text-zinc-400 bg-zinc-950 border-zinc-800 rounded-2xl"
          )}>
            {isActive ? (
              <>
                <Timer className="w-4 h-4" />
                Drawing Soon
              </>
            ) : (
              <span>Winner Announced</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6 pt-0">
          <Button className={cn(
            "w-full font-black h-14 transition-all text-[11px] uppercase tracking-[0.25em]",
            isComicBook && "bg-black text-white rounded-none hover:bg-black/90 skew-x-[-8deg] shadow-[6px_6px_0px_#000] border-none",
            isNeonSyndicate && "bg-zinc-950 text-cyan-400 border-2 border-cyan-500/50 rounded-none italic hover:bg-cyan-400 hover:text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
            isUrban && "bg-slate-100 text-slate-950 rounded-none hover:bg-slate-200 font-mono",
            isHobbyShop && "bg-[#5d4037] text-white rounded-none hover:bg-[#3e2723]",
            (!isComicBook && !isNeonSyndicate && !isUrban && !isHobbyShop) && "bg-white text-zinc-950 hover:bg-zinc-200 shadow-2xl rounded-2xl"
          )}>
            Enter Drop <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
