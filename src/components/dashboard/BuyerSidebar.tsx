"use client";


import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingBag, Heart, MessageSquare, User, History, Settings } from "lucide-react";
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
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  if (!profile) return null;
  const avatarSeed = profile.avatar && profile.avatar.trim() !== '' ? profile.avatar : (profile.uid || profile.email || '');
  const avatarUrl = resolveAvatarUrl(profile.avatar, avatarSeed);
  const displayName = profile.displayName || profile.email || 'User';
  const { isMobile, open, setOpen } = useSidebar();


  const buyerMenu = [
    { href: "/", label: "Home", icon: Home },
    { href: "/buyer/dashboard", label: "Overview", icon: Home },
    { href: "/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/watchlist", label: "Watchlist", icon: Heart },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/activity", label: "Activity", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  const helpMenu = [
    { href: "/help", label: "Help & FAQ", icon: Settings },
  ];

  const handleNav = (href: string) => {
    if (isMobile) setOpen(false);
    router.push(href);
  };
  const handleLogout = async () => {
    // Add your logout logic here
    router.push("/");
  };

  const sidebarContent = (
    <SidebarContent className="p-4 bg-sidebar text-sidebar-foreground border-r border-gray-800 flex flex-col" style={{ width: '240px', minWidth: '240px', maxWidth: '240px', boxSizing: 'border-box', flex: '0 0 240px', zIndex: 2 }}>
      <div className="h-full flex flex-col space-y-6 pt-2">
        <div className="flex flex-col items-center mb-2 mt-2">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="mt-2 text-base font-semibold text-center w-32 truncate">{displayName}</span>
        </div>
        {/* BUYER Section */}
        <SidebarMenu>
          <RedLineSeparator />
          <div className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Buyer</div>
          {buyerMenu.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={pathname === href}
                onClick={() => handleNav(href)}
                className={cn(
                  "justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md",
                  pathname === href ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        {/* HELP & ACCOUNT Section */}
        <SidebarMenu>
          <RedLineSeparator />
          <div className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Help & Account</div>
          {helpMenu.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={pathname === href}
                onClick={() => handleNav(href)}
                className={cn(
                  "justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md",
                  pathname === href ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
    // The open button is handled globally, so just render the sheet content if open
    return open ? sidebarContent : null;
  }
  return sidebarContent;
}
