'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SellerTier } from '@/lib/mock-data';

/**
 * TierBadge - A retro "Life Bar" indicator for dealer status.
 * Always renders 3 hearts. Filled/Pulsing = Earned, Grey = Potential.
 */
export function TierBadge({ tier, className }: { tier?: SellerTier, className?: string }) {
  // Map tier strings to numeric health count
  const count = tier === '3_HEARTS' ? 3 : tier === '2_HEARTS' ? 2 : 1;

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 bg-zinc-950/5 dark:bg-white/5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/10 w-fit", 
        className
      )} 
      title={`${count} Hearts Status`}
    >
      <div className="flex gap-0.5">
        {[1, 2, 3].map((heartIndex) => {
          const isActive = heartIndex <= count;
          return (
            <Heart 
              key={heartIndex} 
              className={cn(
                "w-3.5 h-3.5 transition-all duration-500",
                isActive 
                  ? "text-red-600 fill-red-600 dark:fill-red-500 dark:text-red-500 animate-pulse" 
                  : "text-zinc-300 dark:text-zinc-700 fill-zinc-200 dark:fill-zinc-800"
              )} 
              style={{ 
                animationDelay: isActive ? `${(heartIndex - 1) * 200}ms` : '0ms',
                animationDuration: '2s'
              }}
            />
          );
        })}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest ml-1",
        count === 3 ? "text-green-600" : count === 2 ? "text-amber-600" : "text-red-600"
      )}>
        {count}_LIFE
      </span>
    </div>
  );
}
