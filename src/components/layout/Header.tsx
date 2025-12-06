'use client';

import { useState, KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SidebarTrigger } from '../ui/sidebar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, Bell } from 'lucide-react';

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

// HobbyDork header logo
import headLogo from './hobbydork-head.png';

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

  // Unread notifications for header badge
  const notifQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false),
    );
  }, [firestore, user?.uid]);
  

  const { data: notifications } =
    useCollection<NotificationDoc>(notifQuery as any);

  const unreadCount =
    (notifications || []).filter(
      (n) => !n.isRead && !n.readAt,
    ).length;

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
      <div className="mx-auto flex h-24 max-w-6xl items-center gap-3 px-4 md:px-6 lg:px-8">
        {/* MOBILE: red menu button for sidebar */}
        <SidebarTrigger
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all"
        >
          <span className="flex flex-col gap-1">
            <span className="h-0.5 w-5 rounded-full bg-white" />
            <span className="h-0.5 w-5 rounded-full bg-white" />
            <span className="h-0.5 w-5 rounded-full bg-white" />
          </span>
        </SidebarTrigger>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={headLogo}
            alt="HobbyDork"
            className="h-12 w-auto object-contain mr-3"
            priority
          />
        </Link>

        {/* Search + header actions */}
        <div className="flex flex-1 items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search listings, ISO posts, or stores..."
              className="h-10 w-full rounded-full bg-white text-black border-2 border-red-500 pl-9 pr-4 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              
              onKeyDown={onKeyDown}
            />
          </div>

          {/* Red Nintendo search button */}
          <Button
            type="button"
            onClick={runSearch}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications bell */}
          {user && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative ml-1"
              onClick={() => router.push('/notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
