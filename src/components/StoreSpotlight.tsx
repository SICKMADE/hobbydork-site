
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FeaturedStore } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, Store, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TierBadge } from '@/components/TierBadge';
import { getRandomAvatar } from '@/lib/utils';

interface StoreSpotlightProps {
  store: FeaturedStore;
}

export default function StoreSpotlight({ store }: StoreSpotlightProps) {
  const username = store?.username || 'Collector';
  const tagline = store?.tagline || 'Verified hobbydork Dealer';
  const avatarUrl = store?.avatarUrl || getRandomAvatar(username);
  const bannerUrl = store?.bannerUrl || '/hobbydork-banner-default.jpg';
  const totalSales = store?.totalSales || 0;
  const tier = store?.tier;
  const featuredItems = store?.featuredItems || [];

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-card group h-full flex flex-col">
      <div className="relative aspect-[21/9] overflow-hidden bg-slate-900">
        <Image 
          src={bannerUrl} 
          alt={`${username} spotlight banner`} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
        
        <div className="absolute inset-0 flex items-center px-6">
          <div className="flex gap-4 items-center w-full">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl shrink-0 bg-zinc-100">
              <Image 
                src={avatarUrl} 
                alt={username} 
                fill 
                className="object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-accent text-accent-foreground border-none font-bold uppercase tracking-widest text-[8px] px-2 h-4">
                  Spotlight
                </Badge>
                {tier && <TierBadge tier={tier} className="h-4 text-[8px] px-2" />}
              </div>
              <h3 className="text-xl md:text-2xl font-headline font-black text-white flex items-center gap-2 truncate">
                {username}
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              </h3>
              <p className="text-white/70 text-[10px] font-bold flex items-center gap-2">
                <Star className="w-3 h-3 fill-accent text-accent" /> {totalSales} Sold
              </p>
            </div>
            <Button asChild size="sm" className="hidden sm:flex bg-card text-foreground hover:bg-card/90 font-black px-4 rounded-full h-10 text-xs shrink-0 border-2">
              <Link href={`/shop/${username}`}>
                Visit
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 bg-secondary/5 flex-1 flex flex-col">
        <p className="text-muted-foreground text-xs font-medium italic mb-4 line-clamp-1">"{tagline}"</p>
        <div className="grid grid-cols-3 gap-3">
          {featuredItems.length > 0 ? (
            featuredItems.slice(0, 3).map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden shadow-sm group/item bg-zinc-100">
                <Image src={img} alt="Featured" fill className="object-cover transition-transform group-hover/item:scale-110" />
              </div>
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                <Package className="w-4 h-4 text-muted opacity-30" />
              </div>
            ))
          )}
        </div>
        <Button asChild variant="outline" className="w-full mt-4 h-10 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest sm:hidden">
          <Link href={`/shop/${username}`}>Visit Storefront</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
