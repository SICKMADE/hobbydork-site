'use client';

import Link from 'next/link';
import { Search, ShoppingBag, LogIn, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  
  const safePathname = pathname || '';
  const showSearch = !(
    safePathname.startsWith('/browse') || 
    safePathname.startsWith('/listings') || 
    safePathname.startsWith('/hobbydork-store')
  );

  const notificationsQuery = useMemoFirebase(() => 
    user && db ? query(
      collection(db, 'users', user.uid, 'notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    ) : null,
    [db, user?.uid]
  );

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadCount = notifications?.length || 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSearchValue(params.get('q') || '');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchValue) {
      params.set('q', searchValue);
    }
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <nav className="bg-background/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b sticky top-0 z-50 flex flex-col shadow-sm">
      <div className="container mx-auto px-4 w-full">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between gap-2 md:gap-4 lg:gap-8 h-20 md:h-24">
          {/* Logo (left) and Search bar (center) */}
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <Link href="/" className="shrink-0" title="hobbydork home">
              <Image 
                src="/hobbydork-main.png" 
                alt="hobbydork" 
                width={180} 
                height={48} 
                className="h-10 md:h-14 w-auto"
                priority 
              />
            </Link>
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl relative">
                <Label htmlFor="desktop-nav-search" className="sr-only">Search catalog</Label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-3.5 h-3.5 z-10" />
                <Input 
                  id="desktop-nav-search"
                  name="q"
                  placeholder="Search catalog..." 
                  value={searchValue}
                  title="Search marketplace assets"
                  onChange={(e) => setSearchValue(e.target.value)}
                  className={cn(
                    "pl-10 rounded-full h-10 text-xs shadow-sm transition-all font-medium",
                    "bg-white text-zinc-950 border-2 border-zinc-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
                  )}
                />
              </form>
            )}
          </div>
          {/* Notification/Cart/Sign In icons on the right */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {user && (
              <Button asChild variant="ghost" size="icon" className="rounded-full relative w-9 h-9" title="View notifications">
                <Link href="/notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            {!user && (
              <Button asChild title="Sign in to your account" className="bg-primary text-primary-foreground font-black px-4 h-9 rounded-full flex items-center justify-center text-[9px] uppercase tracking-widest shadow-md">
                <Link href="/login"><LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In</Link>
              </Button>
            )}
            <Button variant="default" size="icon" title="View your cart" className="rounded-full bg-primary hover:bg-primary/90 w-9 h-9 shadow-md">
              <ShoppingBag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex md:hidden items-center justify-between gap-2 h-16">
          {/* Sidebar/Menu button on the far left */}
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          {/* Logo centered */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="shrink-0" title="hobbydork home">
              <Image 
                src="/hobbydork-main.png" 
                alt="hobbydork" 
                width={120} 
                height={32} 
                className="h-8 w-auto"
                priority 
              />
            </Link>
          </div>
          {/* Search and notifications on the right */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <Button 
                variant="ghost" 
                size="icon" 
                title="Toggle search"
                aria-label="Open search bar"
                className="rounded-full w-8 h-8"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            {user && (
              <Button asChild variant="ghost" size="icon" className="rounded-full relative w-8 h-8" title="Notifications">
                <Link href="/notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[7px] font-black rounded-full w-3 h-3 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search bar dropdown */}
        {showSearch && isMobileSearchOpen && (
          <div className="md:hidden pb-2 animate-in slide-in-from-top duration-300">
            <form onSubmit={handleSearch} className="relative">
              <Label htmlFor="mobile-nav-search" className="sr-only">Search items</Label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-3.5 h-3.5 z-10" />
              <Input 
                id="mobile-nav-search"
                name="q"
                placeholder="Search catalog..." 
                value={searchValue}
                title="Search listings"
                aria-label="Search listings"
                onChange={(e) => setSearchValue(e.target.value)}
                className={cn(
                  "pl-9 rounded-full h-9 text-xs shadow-sm",
                  "bg-white text-zinc-950 border-2 border-zinc-200"
                )}
                autoFocus
              />
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
