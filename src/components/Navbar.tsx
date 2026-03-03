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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  
  // Hide search bar on /browse page since it has its own
  const safePathname = pathname || '';
  const showSearch = !(safePathname.startsWith('/browse') || safePathname.startsWith('/listings'));

  // Fetch unread notifications count
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
    <nav className="bg-background/80 dark:bg-[#202020] backdrop-blur-xl border-b sticky top-0 z-50 flex flex-col shadow-sm">
      <div className="container mx-auto px-4 w-full">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between gap-2 md:gap-4 lg:gap-12 h-16 md:h-24">
          {/* Logo */}
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

          {/* Desktop Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 w-5 h-5 z-10" />
              <Input 
                placeholder="Search listings..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-14 bg-card text-foreground dark:bg-white dark:text-zinc-900 dark:border-accent dark:border-4 border-border focus-visible:ring-2 focus-visible:ring-accent rounded-full h-14 text-base shadow-lg"
              />
            </form>
          )}

          {/* Desktop Actions (right side) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4 shrink-0">
            {/* Notification Bell */}
            {user && (
              <Button asChild variant="ghost" size="icon" className="rounded-full relative w-12 h-12" title="Notifications">
                <Link href="/notifications">
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {!user && (
              <Button asChild className="bg-accent text-accent-foreground font-black px-6 h-12 rounded-full flex items-center gap-2">
                <Link href="/login"><LogIn className="w-4 h-4" /> Sign In</Link>
              </Button>
            )}

            <Button variant="default" size="icon" className="rounded-full bg-primary hover:bg-primary/90 w-12 h-12 shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </Button>
          </div>

          {/* Mobile Actions (right side) */}
          <div className="md:hidden flex items-center gap-2 shrink-0">
            {/* Mobile Notification Bell */}
            {user && (
              <Button asChild variant="ghost" size="icon" className="rounded-full relative w-10 h-10" title="Notifications">
                <Link href="/notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {/* Mobile Search Toggle */}
            {showSearch && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-10 h-10"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* Mobile Sidebar Trigger */}
            <SidebarTrigger />
          </div>
        </div>

        {/* Mobile Search Bar (Expandable) */}
        {showSearch && isMobileSearchOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top duration-300">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 w-5 h-5 z-10" />
              <Input 
                placeholder="Search listings..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-12 bg-card text-foreground dark:bg-white dark:text-zinc-900 dark:border-accent dark:border-2 border-border rounded-full h-12 text-base shadow-lg"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}