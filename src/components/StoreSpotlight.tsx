'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ArrowRight, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getRandomAvatar } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

interface StoreSpotlightProps {
  store: any;
}

export default function StoreSpotlight({ store }: StoreSpotlightProps) {
  const db = useFirestore();
  const username = store?.username || 'Collector';
  const tagline = store?.tagline || 'Verified hobbydork Dealer';
  
  // Calculate initial avatar to prevent empty string src error on hydration
  const ownerUid = store?.ownerUid || store?.id;
  const initialPhoto = store?.photoURL || store?.avatar;
  const initialAvatar = (initialPhoto && (initialPhoto.startsWith('http') || initialPhoto.startsWith('data:')))
    ? initialPhoto
    : getRandomAvatar(ownerUid);

  const [bannerSrc, setBannerSrc] = useState('/hobbydork-banner-default.jpg');
  const [avatarSrc, setAvatarSrc] = useState<string>(initialAvatar);

  // Check for Vault Unlock status
  const sellerUserQuery = useMemoFirebase(() => {
    if (!db || !store?.ownerUid) return null;
    return query(collection(db, 'users'), where('uid', '==', store.ownerUid), limit(1));
  }, [db, store?.ownerUid]);
  
  const { data: sellerUsers } = useCollection(sellerUserQuery);
  const sellerProfile = sellerUsers?.[0];

  useEffect(() => {
    if (store?.bannerUrl) {
      setBannerSrc(store.bannerUrl);
    }
    
    // Identity Lock: Sync with latest profile data
    const currentOwnerUid = store?.ownerUid || store?.id;
    const rawPhoto = store?.photoURL || store?.avatar || sellerProfile?.photoURL;
    
    const finalAvatar = (rawPhoto && (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')))
      ? rawPhoto
      : getRandomAvatar(currentOwnerUid);
      
    setAvatarSrc(finalAvatar);
  }, [store, sellerProfile?.photoURL]);

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-card group h-full flex flex-col hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/5 max-w-xs mx-auto md:max-w-none">
      <div className="relative h-20 sm:h-24 md:h-36 overflow-hidden bg-slate-900 shrink-0">
        <Image 
          src={bannerSrc} 
          alt="" 
          fill 
          onError={() => setBannerSrc('/hobbydork-banner-default.jpg')}
          className="object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[0.8] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent" />
        <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-accent text-white border-none font-black uppercase text-[6px] sm:text-[7px] tracking-[0.2em] px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-2xl animate-pulse">
          SPOTLIGHT_NODE
        </Badge>
      </div>
      
      <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6 pt-0 flex-1 flex flex-col items-center text-center -mt-8 sm:-mt-12 md:-mt-16 relative z-10">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-2xl md:rounded-[2rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl bg-zinc-100 mb-3 sm:mb-4 transition-transform group-hover:rotate-2">
          <Image 
            src={avatarSrc} 
            alt={username} 
            fill 
            onError={() => setAvatarSrc(getRandomAvatar(store?.ownerUid || store?.id))}
            className="object-cover" 
          />
        </div>
        
        <div className="space-y-1 mb-4 w-full">
          <div className="flex flex-col items-center gap-1.5">
            <h3 className="text-sm md:text-xl font-headline font-black text-primary dark:text-white flex items-center justify-center gap-1.5 uppercase italic tracking-tighter">
              {username}
              <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-accent" />
            </h3>
            {sellerProfile?.vaultUnlocked && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5 text-[7px] font-black uppercase tracking-[0.2em] h-5 gap-1">
                <Crown className="w-2.5 h-2.5" /> LEGACY_NODE
              </Badge>
            )}
          </div>
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
            {(store?.totalSales || 0).toLocaleString()} DEPLOYMENTS_COMPLETED
          </p>
        </div>

        <p className="text-[10px] md:text-xs text-muted-foreground font-medium italic mb-6 line-clamp-2 px-2 leading-relaxed">
          "{tagline}"
        </p>

        <Button asChild variant="outline" className="w-full mt-auto h-12 rounded-xl border-4 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all gap-3 group/btn shadow-lg">
          <Link href={`/storefronts/${username}`}>
            Enter Storefront <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
