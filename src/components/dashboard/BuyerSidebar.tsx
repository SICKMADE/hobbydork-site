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
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, open, setOpen } = useSidebar();
  if (!user) return null;

  const buyerLinks = [
    { href: "/buyer/dashboard", label: "Overview", icon: Home },
    { href: "/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/watchlist", label: "Watchlist", icon: Heart },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/activity", label: "Activity", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/", label: "Home", icon: Home },
  ];

  const handleNav = (href: string) => {
    if (isMobile) setOpen(false);
    router.push(href);
  };

  const sidebarContent = (
    <SidebarContent className="p-4 bg-sidebar text-sidebar-foreground border-r border-gray-800 flex flex-col" style={{ width: '240px', minWidth: '240px', maxWidth: '240px', boxSizing: 'border-box', flex: '0 0 240px', zIndex: 2 }}>
      <div className="h-full flex flex-col space-y-6 pt-2">
        <SidebarMenu>
          <RedLineSeparator />
          <div className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Buyer</div>
          {buyerLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => handleNav(href)}
                  className={cn(
                    "justify-start gap-3 text-base font-semibold tracking-wide w-full px-2 py-2 rounded-md",
                    isActive ? "bg-muted text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
