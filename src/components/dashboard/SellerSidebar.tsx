"use client";


import { usePathname, useRouter } from "next/navigation";
import { Store, List, BarChart2, DollarSign, Settings, Home, Package, HelpCircle, User, Users, Newspaper, MessageSquare } from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const RedLineSeparator = () => (
  <div className="w-full h-[2px] bg-gradient-to-r from-blue-900 via-blue-500 to-blue-400 rounded-full mb-2" />
);
import { cn } from "@/lib/utils";


import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { resolveAvatarUrl } from '@/lib/default-avatar';
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/client-provider";

export default function SellerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, profile } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSellerProfile() {
      if (!user?.uid || !db) return;
      const sellerRef = doc(db, "users", user.uid);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        if (sellerData.storeId) setStoreId(sellerData.storeId);
      }
    }
    fetchSellerProfile();
  }, [user]);

  // Early return after hooks
  if (!user) return null;

  // Main section
  const mainMenuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/seller/dashboard', label: 'Seller Dashboard', icon: Store },
    { href: '/seller/listings', label: 'Listings', icon: List },
    { href: '/seller/orders', label: 'Orders', icon: Package },
    { href: '/seller/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/seller/payouts', label: 'Payouts', icon: DollarSign },
  ];
  const myStuffMenuItems = [
    { href: '/seller/settings', label: 'Settings', icon: Settings },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/followers', label: 'Followers', icon: Users },
    { href: '/following', label: 'Following', icon: Users },
  ];
  const helpMenuItems = [
    { href: '/help', label: 'Help & FAQ', icon: HelpCircle },
  ];

  // Help & Account section
  const helpMenu = [
    { href: "/help", label: "Help & FAQ", icon: HelpCircle },
  ];

  const { isMobile, open, setOpen } = useSidebar();

  const handleNav = (href: string) => {
    if (isMobile) setOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await logout();
    if (isMobile) setOpen(false);
    router.push("/");
  };


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
              onClick={() => handleNav(item.href)}
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
                  onClick={() => handleNav(item.href)}
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
    // The open button is handled globally, so just render the sheet content if open
    return open ? sidebarContent : null;
  }
  return sidebarContent;
}
