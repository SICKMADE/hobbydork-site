'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Star, ShieldCheck, Search, Award, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { getRandomAvatar } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function TrustBoard() {
  const [searchQuery, setSearchQuery] = useState('');
  const db = useFirestore();

  const storefrontsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'storefronts'), orderBy('totalSales', 'desc'), limit(50));
  }, [db]);

  const { data: sellers, isLoading: loading } = useCollection(storefrontsQuery);

  const filteredSellers = useMemo(() => {
    if (!sellers) return [];
    return sellers.filter(s => 
      s.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sellers, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-2xl mb-4">
            <Award className="w-10 h-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter text-primary">Seller Leaderboard</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              The community rankings. Discover the most active and highly-rated sellers in the hobby.
            </p>
          </div>

          <div className="max-w-md mx-auto relative pt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 mt-2 w-5 h-5 text-muted-foreground z-10" />
            <Input 
              placeholder="Search for a top seller..."
              className="pl-12 h-14 rounded-xl border-2 shadow-sm focus-visible:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="grid gap-6">
          {loading ? (
            <div className="py-32 text-center"><Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" /></div>
          ) : filteredSellers.length === 0 ? (
            <div className="py-32 text-center bg-secondary/10 rounded-2xl border-2 border-dashed font-bold uppercase text-muted-foreground">
              No sellers found.
            </div>
          ) : (
            filteredSellers.map((seller, idx) => (
              <Card key={seller.id} className="border-none shadow-lg bg-card rounded-2xl overflow-hidden group hover:ring-2 hover:ring-accent transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-16 bg-primary text-white flex items-center justify-center font-black text-2xl py-4 md:py-0 md:h-full shrink-0">
                      #{idx + 1}
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-muted shadow-sm shrink-0 bg-muted">
                        <Image 
                          src={seller.avatarUrl || getRandomAvatar(seller.username)} 
                          alt={seller.username} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      
                      <div className="flex-1 text-center md:text-left space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <h3 className="text-2xl font-headline font-black uppercase tracking-tight text-primary">@{seller.username}</h3>
                          <ShieldCheck className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium italic">"{seller.tagline || 'Verified Seller'}"</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                          <Badge variant="outline" className="gap-1.5 font-bold uppercase text-[10px] tracking-widest border-2">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> 5.0 Rating
                          </Badge>
                          <Badge variant="secondary" className="gap-1.5 font-bold uppercase text-[10px] tracking-widest">
                            <ShoppingBag className="w-3 h-3" /> {seller.totalSales || 0} Sales
                          </Badge>
                        </div>
                      </div>

                      <div className="shrink-0 p-6">
                        <Button asChild className="rounded-full px-8 h-12 font-black uppercase tracking-widest">
                          <Link href={`/shop/${seller.username}`}>
                            Visit Shop <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
