import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import type { Store as StoreType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StoreCardProps {
  store: StoreType;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Card className="relative overflow-hidden group transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 bg-card">
      <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity duration-1000 group-hover:opacity-75" style={{ animation: 'glow 4s linear infinite' }} />
      <div className="relative">
        <CardHeader className="flex flex-row items-center gap-4">
          {store.avatarUrl && (
            <Image
                src={store.avatarUrl}
                alt={`${store.storeName} logo`}
                width={64}
                height={64}
                className="rounded-lg border-2 border-primary/50"
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
