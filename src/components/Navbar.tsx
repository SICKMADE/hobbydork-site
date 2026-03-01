'use client';

import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Image from 'next/image';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSearchValue(params.get('q') || '');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (searchValue) {
      params.set('q', searchValue);
    } else {
      params.delete('q');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <nav className="bg-background/80 dark:bg-[#202020] backdrop-blur-xl border-b sticky top-0 z-50 h-16 md:h-24 flex items-center shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 md:gap-8 lg:gap-12">
          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            <Link href="/" className="shrink-0">
              <Image 
                src="/hobbydork-main.png" 
                alt="hobbydork" 
                width={220} 
                height={50} 
                className="h-10 md:h-14 w-auto" 
                priority 
              />
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 w-5 h-5 z-10" />
            <Input 
              placeholder="Search listings..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-14 bg-card text-foreground dark:bg-white dark:text-zinc-900 dark:border-accent dark:border-4 border-border focus-visible:ring-2 focus-visible:ring-accent rounded-full h-14 text-base shadow-lg"
            />
          </form>

          <div className="hidden md:flex items-center gap-4">
            {!user && (
              <Button asChild className="bg-accent text-accent-foreground font-black px-6 h-12 rounded-full flex items-center gap-2">
                <Link href="/login"><LogIn className="w-4 h-4" /> Sign In</Link>
              </Button>
            )}

            <Button variant="default" size="icon" className="rounded-full bg-primary hover:bg-primary/90 w-12 h-12 shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-6 border-t mt-4 flex flex-col gap-3 animate-in slide-in-from-top duration-300 bg-card shadow-2xl p-6 rounded-b-[2rem]">
            <form onSubmit={handleSearch} className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 w-5 h-5 z-10" />
              <Input 
                placeholder="Search..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-12 rounded-full bg-card text-foreground dark:bg-white dark:text-zinc-900 dark:border-accent dark:border-4 border-border h-12 text-base" 
              />
            </form>
            {user ? (
              <Button variant="ghost" asChild className="justify-start font-black text-lg py-6 h-14">
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="justify-start font-black text-lg py-6 h-14 bg-accent text-accent-foreground">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}