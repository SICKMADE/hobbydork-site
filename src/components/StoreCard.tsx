import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Star } from 'lucide-react';
import type { Store as StoreType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StoreCardProps {
  store: StoreType;
  cardImage?: string | null;
  layout?: 'default' | 'spotlight';
}

export default function StoreCard({ store, cardImage, layout = 'default' }: StoreCardProps) {
  const defaultStoreCover = '/store.png';
  const fallbackStoreCover = '/SPOTLIGHT.png';

  // Store cover (banner) is separate from store avatar/logo.
  // For spotlight + store browsing, prefer storeImageUrl.
  const displayImage = cardImage || store.storeImageUrl || defaultStoreCover;

  if (layout === 'spotlight') {
    return (
      <Link href={`/store/${store.storeId}`} passHref>
        <Card className={cn(
          "relative overflow-hidden group transition-colors bg-card/80 hover:bg-card border-2 border-black aspect-square shadow-[3px_3px_0_rgba(0,0,0,0.25)]",
          store.isSpotlighted ? "" : ""
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(displayImage)}
            alt={`${store.storeName} banner`}
            className="absolute inset-0 h-full w-full object-contain bg-muted"
            data-ai-hint="store banner"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fallbackApplied === '1') return;
              el.dataset.fallbackApplied = '1';
              el.src = fallbackStoreCover;
            }}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
            {store.isSpotlighted && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 z-10">
                <Star className="h-3 w-3" />
                <span>SPOTLIGHT</span>
              </div>
            )}
            <h3 className="text-lg font-bold drop-shadow-md">{store.storeName}</h3>
            <p className="text-xs text-white/80 drop-shadow-sm line-clamp-2">{store.about}</p>
            <div className="w-full mt-3 comic-button flex items-center justify-center gap-2 bg-primary text-white rounded px-3 py-2 font-semibold shadow hover:bg-primary/90 transition cursor-pointer select-none">
              <Store className="mr-2 h-4 w-4" />
              Visit Store
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Default layout
  return (
    <Card className={cn(
        "relative overflow-hidden group transition-colors bg-card/80 hover:bg-card border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
    )}>
      <div className="relative">
        {store.isSpotlighted && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 z-10">
                <Star className="h-3 w-3" />
                <span>SPOTLIGHT</span>
            </div>
        )}
        <CardHeader className="flex flex-row items-center gap-4">
          {/* Store avatar/logo: use avatarUrl; storeImageUrl is the cover. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(store.avatarUrl || '/hobbydork-head.png')}
            alt={`${store.storeName} logo`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg border-2 border-black bg-muted object-contain"
            data-ai-hint="store logo"
          />
          <div>
            <CardTitle className="text-2xl font-bold text-card-foreground">{store.storeName}</CardTitle>
            <CardDescription className="text-muted-foreground">/{store.slug}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-card-foreground/80 min-h-[40px] line-clamp-2">{store.about}</p>
          <Link href={`/store/${store.storeId}`} passHref>
            <Button variant="outline" className="w-full border-2 border-black bg-muted/40 hover:bg-muted/60">
              <Store className="mr-2 h-4 w-4" />
              Visit Store
            </Button>
          </Link>
        </CardContent>
      </div>
    </Card>
  );
}
