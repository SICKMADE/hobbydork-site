'use client';

import Image from 'next/image';
import { SidebarTrigger } from '../ui/sidebar';
import { UserNav } from './UserNav';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { Button } from '../ui/button';

// wide HobbyDork logo – same folder as Header.tsx
import headLogo from './hobbydork-head.png';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-32 items-center gap-4 border-b bg-card px-4 md:px-6 lg:px-8">
      {/* mobile sidebar toggle */}
      <SidebarTrigger className="md:hidden" />

      {/* center section: logo + search bar + START */}
      <div className="flex-1 flex justify-center items-center">
        <div
          className="w-full max-w-5xl rounded-lg p-2 flex items-center gap-4"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.7)',
          }}
        >
          {/* BIGGER LOGO */}
          <div className="hidden md:flex items-center">
            <Image
              src={headLogo}
              alt="HobbyDork"
              className="h-14 sm:h-16 w-auto flex-shrink-0"
              priority
            />
          </div>

          {/* SEARCH */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search collectibles, stores, and users..."
              className="pl-10 h-10 text-base bg-black border-white shadow-inner text-white placeholder:text-gray-500 rounded-md w-full"
            />
          </div>

          {/* START BUTTON */}
          <Button
            className="h-9 w-24 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-[0_4px_#9f1212] active:shadow-none active:translate-y-1 transition-all"
          >
            START
          </Button>
        </div>
      </div>

      {/* right side: user menu */}
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}
