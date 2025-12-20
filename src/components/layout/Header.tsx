'use client';

import { useState, KeyboardEvent } from 'react';
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

import Logo from '@/components/Logo';

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
    useCollection<NotificationDoc>(notifQuery);

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
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        {/* Row 1: menu + logo + bell (mobile stacks, desktop just left side) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* MOBILE: red menu button for sidebar */}
            <SidebarTrigger
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all md:hidden"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-5 rounded-full bg-white" />
                <span className="h-0.5 w-5 rounded-full bg-white" />
                <span className="h-0.5 w-5 rounded-full bg-white" />
              </span>
            </SidebarTrigger>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="mr-1 md:hidden">
                <Logo iconOnly />
              </span>
              <span className="mr-1 hidden md:block">
                <Logo />
              </span>
            </Link>
          </div>

          {/* Notifications bell */}
          {user && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
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

        {/* Row 2: full-width search bar (on md+ this sits to the right) */}
        <div className="flex w-full items-center gap-3">
          <div className="relative flex-1">
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

          {/* Red Nintendo search button */}
          <Button
            type="button"
            aria-label="Search"
            onClick={runSearch}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
