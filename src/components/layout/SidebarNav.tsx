
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

const RedLineSeparator = () => (
    <div className="h-0.5 w-full my-2 bg-destructive" />
);


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
      { href: '/profile', label: 'Profile', icon: User },
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
      <SidebarHeader className="p-4 pt-6 text-center">
        <Logo iconOnly={true} />
        <p className="text-sm font-body text-muted-foreground mt-2">A safe marketplace to buy and sell</p>
      </SidebarHeader>
      <SidebarContent className="p-4 pt-4">
        
        <div className="bg-black rounded-lg p-2">
            <SidebarMenu>
            {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                    href={item.href}
                    isActive={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    className="justify-start gap-3 text-base"
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </div>
        
        <RedLineSeparator />

        <div className="bg-neutral-800/50 rounded-lg p-2">
            <SidebarMenu>
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Vault</p>
                {personalMenuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                            href={item.href}
                            isActive={pathname.startsWith(item.href)}
                            onClick={() => router.push(item.href)}
                            className="justify-start gap-3 text-base"
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
        
        {profile?.isSeller && (
            <>
              <RedLineSeparator />
              <div className="bg-black rounded-lg p-2">
                <SidebarMenu>
                    <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Store</p>
                    {userMenuItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                                href={item.href}
                                isActive={pathname.startsWith(item.href)}
                                onClick={() => router.push(item.href)}
                                className="justify-start gap-3 text-base"
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </div>
            </>
        )}
        
        {profile?.role === 'ADMIN' && (
            <>
              <RedLineSeparator />
              <div className="bg-neutral-800/50 rounded-lg p-2">
                <SidebarMenu>
                    <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                    {adminMenuItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                                href={item.href}
                                isActive={pathname.startsWith(item.href)}
                                onClick={() => router.push(item.href)}
                                className="justify-start gap-3 text-base"
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </div>
            </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/help')} className="justify-start gap-3 text-base">
                    <HelpCircle className="h-5 w-5" />
                    <span>Help</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="justify-start gap-3 text-base">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
