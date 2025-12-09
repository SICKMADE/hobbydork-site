import Image from 'next/image';
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
  const displayImage = cardImage || store.avatarUrl;

  if (layout === 'spotlight') {
    return (
      <Card className={cn(
        "relative overflow-hidden group transition-all duration-300 hover:shadow-2xl bg-card",
        store.isSpotlighted ? "border-primary/50 hover:shadow-primary/20" : "hover:border-primary/50 hover:shadow-primary/20"
      )}>
         {/* Animated gradient glow for spotlighted cards */}
        {store.isSpotlighted && (
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-75 blur transition-opacity duration-1000 group-hover:opacity-100" style={{ animation: 'glow 4s linear infinite' }} />
        )}
        <div className="relative">
            {store.isSpotlighted && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 z-10">
                <Star className="h-3 w-3" />
                <span>SPOTLIGHT</span>
              </div>
            )}
            <div className="relative aspect-video w-full">
              {displayImage && (
                  <Image
                      src={displayImage}
                      alt={`${store.storeName} banner`}
                      fill
                      className="object-contain"
                      data-ai-hint="store banner"
                  />
              )}
            </div>
            <div className="p-4">
                <CardTitle className="text-lg font-bold text-card-foreground">{store.storeName}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">{store.about}</CardDescription>
                <Link href={`/store/${store.storeId}`} passHref>
                  <Button variant="outline" className="w-full mt-4">
                    <Store className="mr-2 h-4 w-4" />
                    Visit Store
                  </Button>
                </Link>
            </div>
        </div>
         <style jsx>{`
            @keyframes glow {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
        `}</style>
      </Card>
    );
  }

  // Default layout
  return (
    <Card className={cn(
        "relative overflow-hidden group transition-all duration-300 hover:shadow-2xl bg-card",
        store.isSpotlighted ? "border-primary/50 hover:shadow-primary/20" : "hover:border-primary/50 hover:shadow-primary/20"
    )}>
      {store.isSpotlighted && (
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity duration-1000 group-hover:opacity-75" style={{ animation: 'glow 4s linear infinite' }} />
      )}
      <div className="relative">
        {store.isSpotlighted && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 z-10">
                <Star className="h-3 w-3" />
                <span>SPOTLIGHT</span>
            </div>
        )}
        <CardHeader className="flex flex-row items-center gap-4">
          {displayImage && (
            <Image
                src={displayImage}
                alt={`${store.storeName} logo`}
                width={64}
                height={64}
                className="rounded-lg border-2 border-primary/50 object-cover"
                data-ai-hint="store logo"
            />
          )}
          <div>
            <CardTitle className="text-2xl font-bold text-card-foreground">{store.storeName}</CardTitle>
            <CardDescription className="text-muted-foreground">/{store.slug}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-card-foreground/80 min-h-[40px] line-clamp-2">{store.about}</p>
          <Link href={`/store/${store.storeId}`} passHref>
            <Button variant="outline" className="w-full">
              <Store className="mr-2 h-4 w-4" />
              Visit Store
            </Button>
          </Link>
        </CardContent>
      </div>
      <style jsx>{`
        @keyframes glow {
          0% {
            -webkit-mask: linear-gradient(120deg, #000 25%, #0005, #000 75%);
            -webkit-mask-size: 400%;
            -webkit-mask-position: 150%;
          }
          100% {
            -webkit-mask: linear-gradient(120deg, #000 25%, #0005, #000 75%);
            -webkit-mask-size: 400%;
            -webkit-mask-position: -50%;
          }
        }
      `}</style>
    </Card>
  );
}
