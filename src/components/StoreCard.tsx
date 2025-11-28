import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import type { Store as StoreType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StoreCardProps {
  store: StoreType;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Card className="relative overflow-hidden group transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[glow_8s_ease-in-out_infinite]" />
      <div className="relative">
        <CardHeader className="flex flex-row items-center gap-4">
          <Image
            src={store.logo}
            alt={`${store.name} logo`}
            width={64}
            height={64}
            className="rounded-lg border-2 border-primary/50"
            data-ai-hint="store logo"
          />
          <div>
            <CardTitle className="text-2xl font-bold">{store.name}</CardTitle>
            <CardDescription className="text-muted-foreground">/{store.url}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground/80 min-h-[40px]">{store.about}</p>
          <Button variant="outline" className="w-full">
            <Store className="mr-2 h-4 w-4" />
            Visit Store
          </Button>
        </CardContent>
      </div>
      <style jsx>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px -10px hsl(var(--primary)); }
          50% { box-shadow: 0 0 40px 0px hsl(var(--accent) / 0.7); }
        }
        .animate-glow {
          animation: glow 8s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
