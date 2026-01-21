"use client";
import { Button } from '@/components/ui/button';
// ...existing code...

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

import {
  LogOut,
  Home,
  Search,
  Store,
  MessageSquare,
  Newspaper,
// ...existing code...

    Heart,
    Settings,
    User,
    Star,
    HelpCircle,
    ShoppingCart,
    Package,
    HeartHandshake,
    History,
    Users,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  orderBy,
  query,
} from 'firebase/firestore';

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { resolveAvatarUrl } from '@/lib/default-avatar';
import MiniAskTV from '@/components/dashboard/MiniAskTV';




const RedLineSeparator = () => (
  <div className="w-full h-[2px] bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-full mb-2" />
);

interface SidebarNavProps {}

export default function SidebarNav({}: SidebarNavProps) {
  const { user, profile, logout } = useAuth();
  const { isMobile, setOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  // User is considered verified if logged in and emailVerified is true
  const isVerified = !!user && !!profile?.emailVerified;

  const displayName = profile?.displayName || user?.email || 'My account';
  const avatarUrl = resolveAvatarUrl(profile?.avatar, user?.uid || user?.email || displayName);

  const navigate = (href: string) => {
    if (isMobile) setOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await logout();
    if (isMobile) setOpen(false);
    router.push('/');
  };




  const mainMenuItems = [
    { href: '/', label: 'Home', icon: Home, protected: false },
    { href: '/search', label: 'Browse', icon: Search, protected: false },
    { href: '/stores', label: 'Stores', icon: Users, protected: false },
    { href: '/hobbydork-store', label: 'HobbyDork Store', icon: Store, protected: false },
    { href: '/iso24', label: 'ISO24', icon: Newspaper, protected: false },
    { href: '/chat', label: 'Community', icon: MessageSquare, protected: false },
    { href: '/giveaway', label: 'Giveaway', icon: Star, protected: false },
  ];

  // Only show dashboard links if user is present
  const personalMenuItems = user
    ? [{ href: '/buyer/dashboard', label: 'Buyer Dashboard', icon: Home, protected: true }]
    : [];

  const sellerMenuItems = user && profile?.isSeller
    ? [{ href: '/seller/dashboard', label: 'Seller Dashboard', icon: Store, protected: true }]
    : [];

  const adminMenuItems = isVerified && profile?.role === 'ADMIN'
    ? [{ href: '/admin', label: 'Admin Dashboard', icon: Star, protected: true }]
    : [];

  const helpMenuItems = [
    { href: '/help', label: 'Help & FAQ', icon: HelpCircle },
  ];

  return (
    <>
      <SidebarContent className="p-4">
        <div className="h-full flex flex-col space-y-4 pt-2">
          {/* Main */}
          <div
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Main
              </p>
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isDisabled = false;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => !isDisabled && navigate(item.href)}
                      className={`justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                      disabled={isDisabled}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* My Stuff (only for verified users) */}
          {isVerified && (
            <div>
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  My Stuff
                </p>
                {personalMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isDisabled = false;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => !isDisabled && navigate(item.href)}
                        className={`justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={isDisabled}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                {/* If not a seller, show apply button */}
                {!profile?.isSeller && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === '/become-seller'}
                      onClick={() => navigate('/become-seller')}
                      className="justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md text-green-700 focus-visible:ring-2 focus-visible:ring-green-500"
                      aria-label="Apply to Become a Seller"
                    >
                      <span>Apply to Become a Seller</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </div>
          )}

          {/* Seller Dashboard entry only (seller only, verified only) */}
          {isVerified && profile?.isSeller && (
            <div>
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Seller
                </p>
                {sellerMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isDisabled = false;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => !isDisabled && navigate(item.href)}
                        className={`justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={isDisabled}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          )}

          {/* Admin (verified only) */}
          {isVerified && profile?.role === 'ADMIN' && (
            <div>
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isDisabled = false;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => !isDisabled && navigate(item.href)}
                        className={`justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={isDisabled}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          )}

          {/* Help + Logout */}
          <div
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Help & Account
              </p>

              {helpMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className="justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

            </SidebarMenu>
          </div>
        </div>
        <div className="mt-auto pt-6 flex justify-center opacity-90">
          <MiniAskTV />
        </div>
      </SidebarContent>
    </>
  );
}
