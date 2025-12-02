
'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

import { LogOut, Home, Search, Store, MessageSquare, Newspaper, Heart, Settings, User, Star, HelpCircle, ShoppingCart, Package, HeartHandshake } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';

const RedLineSeparator = () => (
    <div className="h-0.5 w-full bg-red-600" />
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

  const utilityMenuItems = [
      { href: '/help', label: 'Help', icon: HelpCircle },
      { href: '#', label: 'Logout', icon: LogOut, onClick: handleLogout },
  ]

  return (
    <>
      <SidebarHeader className="p-4 pt-12 text-center">
        <Logo iconOnly={true} />
        <p className="text-sm font-nintendo tracking-wider text-muted-foreground mt-4">A safe marketplace to buy and sell</p>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <div 
          className="h-full flex flex-col space-y-4"
          style={{
            backgroundImage: 'linear-gradient(45deg, hsl(0 0% 13% / 0.4) 25%, transparent 25%), linear-gradient(-45deg, hsl(0 0% 13% / 0.4) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(0 0% 13% / 0.4) 75%), linear-gradient(-45deg, transparent 75%, hsl(0 0% 13% / 0.4) 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
            <div className="bg-black/80 rounded-lg p-2">
                <SidebarMenu>
                 <RedLineSeparator />
                {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                        href={item.href}
                        isActive={pathname === item.href}
                        onClick={() => router.push(item.href)}
                        className="justify-start gap-4 text-base font-medium tracking-wide"
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>
            
            <div className="bg-black/80 rounded-lg p-2">
                <SidebarMenu>
                     <RedLineSeparator />
                    <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Vault</p>
                    {personalMenuItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                                href={item.href}
                                isActive={pathname.startsWith(item.href)}
                                onClick={() => router.push(item.href)}
                                className="justify-start gap-4 text-base font-medium tracking-wide"
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </div>
            
            {profile?.isSeller && (
                <div className="bg-black/80 rounded-lg p-2">
                    <SidebarMenu>
                         <RedLineSeparator />
                        <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Store</p>
                        {userMenuItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    href={item.href}
                                    isActive={pathname.startsWith(item.href)}
                                    onClick={() => router.push(item.href)}
                                    className="justify-start gap-4 text-base font-medium tracking-wide"
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </div>
            )}
            
            {profile?.role === 'ADMIN' && (
                <div className="bg-black/80 rounded-lg p-2">
                    <SidebarMenu>
                        <RedLineSeparator />
                        <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                        {adminMenuItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    href={item.href}
                                    isActive={pathname.startsWith(item.href)}
                                    onClick={() => router.push(item.href)}
                                    className="justify-start gap-4 text-base font-medium tracking-wide"
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </div>
            )}
            
              <div className="bg-black/80 rounded-lg p-2">
                  <SidebarMenu>
                        <RedLineSeparator />
                      <SidebarMenuItem>
                          <SidebarMenuButton onClick={() => router.push('/help')} className="justify-start gap-4 text-base font-medium tracking-wide">
                              <HelpCircle className="h-5 w-5" />
                              <span>Help</span>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} className="justify-start gap-4 text-base font-medium tracking-wide">
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  </SidebarMenu>
              </div>
        </div>
      </SidebarContent>
    </>
  );
}
