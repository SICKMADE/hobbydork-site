'use client';
import { SidebarTrigger } from '../ui/sidebar';
import { UserNav } from './UserNav';
import Logo from '../Logo';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export default function Header() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="hidden md:flex" />
          <div className="hidden md:block">
            <Logo iconOnly />
          </div>
           <div className="md:hidden">
            <Logo />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center items-center gap-2 px-4">
            <div className="w-full max-w-lg relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search collectibles, stores, and users..."
                    className="pl-10 h-10 text-base bg-input border-border"
                />
            </div>
            <Button
              className="h-9 w-24 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-[0_4px_#9f1212] active:shadow-none active:translate-y-1 transition-all"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              START
            </Button>
        </div>


        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>
    </>
  );
}
