'use client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { mockListings, mockStores } from '@/lib/data';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Star, MessageSquare, Heart, ShoppingCart, Bolt } from 'lucide-react';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = mockListings.find((l) => l.id === params.id);
  
  if (!listing) {
    notFound();
  }

  const store = mockStores.find((s) => s.id === listing.storeId);

  return (
    <AppLayout>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {listing.images.map((img, index) => (
                <CarouselItem key={index}>
                  <Card className="overflow-hidden">
                    <div className="aspect-square relative">
                      <Image
                        src={img}
                        alt={`${listing.title} image ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint="collectible item image"
                      />
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2" />
            <CarouselNext className="absolute right-2" />
          </Carousel>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{listing.category}</Badge>
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{listing.title}</h1>
          </div>

          <div className="flex items-baseline gap-4">
             <p className="text-4xl font-bold text-primary">${listing.price.toFixed(2)}</p>
             <p className="text-sm text-muted-foreground">{listing.quantity} available</p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition</span>
                    <span className="font-semibold">{listing.condition}</span>
                </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button size="lg"><ShoppingCart className="mr-2" />Add to Cart</Button>
            <Button size="lg" variant="default"><Bolt className="mr-2"/>Buy Now</Button>
          </div>
          
           <Separator />

           {store && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Image
                  src={store.logo}
                  alt={`${store.name} logo`}
                  width={48}
                  height={48}
                  className="rounded-full"
                  data-ai-hint="store logo"
                />
                <div>
                  <p className="font-semibold">{store.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{store.rating}</span>
                    </div>
                    <span>&middot;</span>
                    <span>{store.itemsSold} items sold</span>
                  </div>
                </div>
              </CardHeader>
               <CardContent>
                  <Button variant="outline" className="w-full">View Store</Button>
               </CardContent>
            </Card>
          )}

          <Separator />
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-foreground/80">{listing.description}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline"><MessageSquare className="mr-2" /> Message Seller</Button>
            <Button variant="outline"><Heart className="mr-2" /> Add to Watchlist</Button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
