'use client';

import { useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SidebarTrigger } from '../ui/sidebar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, MessageSquare } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  query,
  where,
} from 'firebase/firestore';


import Logo from '@/components/Logo';
import NotifBell from '@/components/notifications/NotifBell';

type NotificationDoc = {
  id?: string;
  isRead?: boolean;
  readAt?: any | null;
};

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const firestore = useFirestore();


  // Notification logic removed

  const runSearch = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-muted">
      {/* Messages Icon - fixed very top right of viewport */}
      <Link
        href="/messages"
        aria-label="Messages"
        className="fixed right-4 top-4 z-50"
      >
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_4px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all hover:bg-red-600 focus:outline-none"
        >
          <MessageSquare className="h-4 w-4" />
        </span>
      </Link>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 md:px-6 lg:px-8">
        {/* Logo and Search Bar: tightly grouped */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link href="/" className="flex items-center">
            <span className="md:hidden">
              <Logo iconOnly />
            </span>
            <span className="hidden md:block">
              <Logo />
            </span>
          </Link>
        </div>
        {/* Center: Search Bar */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search listings, ISO posts, or stores..."
              className="h-10 w-full rounded-full bg-white text-black placeholder:text-zinc-500 border-2 border-red-500 pl-9 pr-4 text-sm shadow-[2px_2px_0_rgba(0,0,0,0.35)] focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <Button
            type="button"
            aria-label="Search"
            onClick={runSearch}
            className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {/* Right: Notification Bell */}
        <div className="flex items-center ml-4">
          <NotifBell />
        </div>
      </div>
    </header>
  );
}
