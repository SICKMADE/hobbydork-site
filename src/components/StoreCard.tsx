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
       <Link href={`/store/${store.storeId}`} passHref>
        <Card className={cn(
          "relative overflow-hidden group transition-all duration-300 hover:shadow-2xl bg-card aspect-square",
          store.isSpotlighted ? "border-primary/50" : ""
        )}>
            {displayImage && (
                <Image
                    src={displayImage}
                    alt={`${store.storeName} banner`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="store banner"
                />
            )}
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
                 <Button variant="secondary" className="w-full mt-3">
                    <Store className="mr-2 h-4 w-4" />
                    Visit Store
                </Button>
            </div>
        </Card>
      </Link>
    );
  }

  // Default layout
  return (
    <Card className={cn(
        "relative overflow-hidden group transition-all duration-300 hover:shadow-2xl bg-card",
        store.isSpotlighted ? "border-primary/50 hover:shadow-primary/20" : "hover:border-primary/50 hover:shadow-primary/20"
    )}>
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
    </Card>
  );
}
