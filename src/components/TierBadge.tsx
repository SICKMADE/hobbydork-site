'use client';

import { Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type SellerTier } from '@/lib/mock-data';

export function TierBadge({ tier, className }: { tier?: SellerTier, className?: string }) {
  if (!tier) return null;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-bold uppercase text-[10px] px-3 py-1 tracking-widest", className)}>
      <Medal className="w-3.5 h-3.5" />
      {tier}
    </Badge>
  );
}