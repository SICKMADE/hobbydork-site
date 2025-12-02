
'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';

import { LogOut, Home, Search, Store, MessageSquare, Newspaper, Heart, Settings, User, Star, HelpCircle, ShoppingCart, Package, HeartHandshake } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';

export default function SidebarNav() {
  const { logout, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
  }

  const mainMenuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Browse', icon: Search },
    { href: '/iso24', label: 'ISO24', icon: Newspaper },
    { href: '/chat', label: 'Community', icon: MessageSquare },
  ];
  
  const personalMenuItems = [
      { href: '/orders', label: 'My Orders', icon: Package },
      { href: '/sales', label: 'My Sales', icon: HeartHandshake },
      { href: '/watchlist', label: 'Watchlist', icon: Heart },
      { href: '/favorites', label: 'Favorite Stores', icon: Store },
      { href: '/cart', label: 'Cart', icon: ShoppingCart },
  ];

  const userMenuItems = [
    { href: '/listings', label: 'My Listings', icon: Store },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminMenuItems = [
      { href: '/admin/users', label: 'Manage Users', icon: User },
      { href: '/admin/spotlight', label: 'Spotlight', icon: Star },
  ]

  return (
    <>
      <SidebarHeader>
        {/* Logo removed from header */}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname === item.href}
                onClick={() => router.push(item.href)}
                className="justify-start gap-3"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-base">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
         <SidebarMenu className="mt-4">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Vault</p>
            {personalMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                        href={item.href}
                        isActive={pathname.startsWith(item.href)}
                        onClick={() => router.push(item.href)}
                        className="justify-start gap-3"
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
        {profile?.isSeller && (
            <SidebarMenu className="mt-4">
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Store</p>
                 {userMenuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                            href={item.href}
                            isActive={pathname.startsWith(item.href)}
                             onClick={() => router.push(item.href)}
                            className="justify-start gap-3"
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-base">{item.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        )}
        {profile?.role === 'ADMIN' && (
             <SidebarMenu className="mt-4">
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                 {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                            href={item.href}
                            isActive={pathname.startsWith(item.href)}
                             onClick={() => router.push(item.href)}
                            className="justify-start gap-3"
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-base">{item.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto">
        <Logo iconOnly={true} className="w-48 h-48 mx-auto" />
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/help')} className="justify-start gap-3">
                    <HelpCircle className="h-5 w-5" />
                    <span className="text-base">Help</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="justify-start gap-3">
              <LogOut className="h-5 w-5" />
              <span className="text-base">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
