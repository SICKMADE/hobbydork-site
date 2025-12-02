
'use client';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { UserNav } from './UserNav';
import Logo from '../Logo';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { PanelLeft } from 'lucide-react';

export default function Header() {
  const { isMobile } = useSidebar();
  
  return (
    <>
      <header className="sticky top-0 z-30 flex h-32 items-center gap-4 border-b bg-card px-4 md:px-6 lg:px-8">
        
        {/* This button is only for toggling the sidebar on mobile and should be hidden on desktop */}
        <SidebarTrigger className="md:hidden" />

        {/* Search Bar & Logo */}
        <div className="flex-1 flex justify-center items-center">
          <div
            className="w-full max-w-4xl rounded-lg p-2 flex items-center gap-4 border-2 border-white"
            style={{
              backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.7)'
            }}
          >
            <div className="hidden md:flex">
              <Logo />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search collectibles, stores, and users..."
                className="pl-10 h-10 text-base bg-black border-gray-700 shadow-inner text-white placeholder:text-gray-500 rounded-md w-full"
              />
            </div>
            <Button
              className="h-9 w-24 bg-red-600 hover:bg-red-700 text-white font-sans rounded-full shadow-[0_4px_#9f1212] active:shadow-none active:translate-y-1 transition-all"
            >
              START
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>
    </>
  );
}
