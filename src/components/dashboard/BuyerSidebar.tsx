"use client";


import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingBag, Heart, MessageSquare, User, History, Settings, Search, Users, Store, Newspaper, Star, HelpCircle, LayoutDashboard } from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

import { cn } from "@/lib/utils";

const RedLineSeparator = () => (
  <div className="w-full h-[2px] bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-full mb-2" />
);


import { useAuth } from "@/hooks/use-auth";
import { resolveAvatarUrl } from '@/lib/default-avatar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function BuyerSidebar() {
  const { user, profile, logout } = useAuth();
  const { isMobile, setOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  if (!profile) return null;
  const displayName = profile.displayName || user?.email || 'My account';
  const avatarUrl = resolveAvatarUrl(profile.avatar, profile.uid || profile.email || displayName);

  const navigate = (href: string) => {
    if (isMobile) setOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await logout?.();
    if (isMobile) setOpen(false);
    router.push('/');
  };

  // Buyer-specific menu items
  const mainMenuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/buyer/dashboard', label: 'Buyer Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/watchlist', label: 'Watchlist', icon: Heart },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];
  const myStuffMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/followers', label: 'Followers', icon: Users },
    { href: '/following', label: 'Following', icon: Users },
    { href: '/activity', label: 'Activity', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  const helpMenuItems = [
    { href: '/help', label: 'Help & FAQ', icon: HelpCircle },
  ];

  const renderMenuSection = (title: string, items: any[]) => (
    <SidebarMenu>
      <RedLineSeparator />
      <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {items.map((item) => {
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
  );

  const sidebarContent = (
    <SidebarContent className="p-4 bg-sidebar text-sidebar-foreground border-r border-gray-800">
      <div className="h-full flex flex-col space-y-4 pt-2">
        {/* Only menu sections, avatar handled by SidebarUserMenu */}
        {renderMenuSection('Main', mainMenuItems)}
        {renderMenuSection('My Stuff', myStuffMenuItems)}
        <SidebarMenu>
          <RedLineSeparator />
          <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Help & Account</p>
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
                  <span className="truncate">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={false}
              onClick={handleLogout}
              className="justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md text-red-600 hover:bg-red-100"
            >
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </SidebarContent>
  );

  if (isMobile) {
    return isMobile ? sidebarContent : null;
  }
  return sidebarContent;
}
