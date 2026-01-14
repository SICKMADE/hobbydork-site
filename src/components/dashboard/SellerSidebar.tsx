"use client";


import { usePathname, useRouter } from "next/navigation";
import { Store, List, BarChart2, DollarSign, Settings, Home, Package, HelpCircle, Search, Users, Newspaper, MessageSquare, Star } from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const RedLineSeparator = () => (
  <div className="w-full h-[2px] bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-full mb-2" />
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

  // Avatar and username at the top (use profile for avatar/displayName)
  const typedProfile = profile as any;
  const avatarSeed = typedProfile?.avatar && typedProfile.avatar.trim() !== '' ? typedProfile.avatar : (typedProfile?.uid || typedProfile?.email || '');
  const avatarUrl = resolveAvatarUrl(typedProfile?.avatar, avatarSeed);
  const displayName = typedProfile?.displayName || typedProfile?.email || 'User';


  // Seller section (only seller-related links)
  const sellerMenu = [
    { href: "/seller/dashboard", label: "Overview", icon: Store },
    { href: "/seller/listings", label: "Listings", icon: List },
    { href: "/seller/orders", label: "Orders", icon: Package },
    { href: "/sales", label: "Sales", icon: DollarSign },
    { href: "/seller-analytics", label: "Analytics", icon: BarChart2 },
    { href: "/seller/payouts", label: "Payouts", icon: DollarSign },
    { href: "/seller/settings", label: "Settings", icon: Settings },
    { href: "/", label: "Home", icon: Home },
    { href: storeId ? `/store/${storeId}` : "/hobbydork-store", label: "My Store", icon: Store },
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
        {/* SELLER Section */}
        <SidebarMenu>
          <RedLineSeparator />
          <div className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seller</div>
          {sellerMenu.map(({ href, label, icon: Icon }) => (
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
