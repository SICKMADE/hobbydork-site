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



const RedLineSeparator = () => (
  <div className="w-full h-[2px] bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-full mb-2" />
);

export default function SidebarNav() {
  const { user, profile, logout } = useAuth();
  const { isMobile, setOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

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
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Browse', icon: Search },
    { href: '/stores', label: 'Stores', icon: Users },
    { href: '/hobbydork-store', label: 'HobbyDork Store', icon: Store },
    { href: '/iso24', label: 'ISO24', icon: Newspaper },
    { href: '/chat', label: 'Community', icon: MessageSquare },
    { href: '/giveaway', label: 'Giveaway', icon: Star },
  ];

  const personalMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/activity', label: 'My Activity', icon: History },
    { href: '/watchlist', label: 'Watchlist', icon: Heart },
    { href: '/favorites', label: 'Favorite Stores', icon: Store },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  const sellerMenuItems = [
    { href: '/seller/dashboard', label: 'Seller Dashboard', icon: Store },
  ];

  const adminMenuItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: Star },
  ];

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
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className="justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* My Stuff */}
          <div
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                My Stuff
              </p>
              {personalMenuItems.map((item) => {
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

          {/* My Store (seller only) */}
          {profile?.isSeller && (
            <div
            >
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  My Store
                </p>

                {/* Direct link to public store page */}
                {profile?.storeId && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(
                        `/store/${profile.storeId}`,
                      )}
                      onClick={() =>
                        navigate(`/store/${profile.storeId}`)
                      }
                      className="justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md"
                    >
                      <Store className="h-5 w-5" />
                      <span>My Store</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {sellerMenuItems.map((item) => {
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
          )}

          {/* Admin */}
          {profile?.role === 'ADMIN' && (
            <div
            >
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
                {adminMenuItems.map((item) => {
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
      </SidebarContent>
    </>
  );
}
