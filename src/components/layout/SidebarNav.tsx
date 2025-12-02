
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

  return (
    <>
      <SidebarHeader className="p-4 pt-6 text-center">
        <Logo iconOnly={true} />
        <p className="text-sm font-body text-muted-foreground mt-2">A safe marketplace to buy and sell</p>
      </SidebarHeader>
      <SidebarContent className="p-4 pt-4 flex flex-col">
        <div 
          className="flex-grow flex flex-col justify-between"
          style={{
            backgroundImage:
              'linear-gradient(45deg, hsla(0,0%,13%,.4) 25%, transparent 25%), linear-gradient(-45deg, hsla(0,0%,13%,.4) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsla(0,0%,13%,.4) 75%), linear-gradient(-45deg, transparent 75%, hsla(0,0%,13%,.4) 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          <div>
            <RedLineSeparator />
            <div className="bg-black/80 rounded-lg p-2 mt-4">
                <SidebarMenu>
                {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                        href={item.href}
                        isActive={pathname === item.href}
                        onClick={() => router.push(item.href)}
                        className="justify-start gap-4 text-base h-12"
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>
            
             <RedLineSeparator />
            
            <div className="bg-black/80 rounded-lg p-2 mt-4">
                <SidebarMenu>
                    <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Vault</p>
                    {personalMenuItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                                href={item.href}
                                isActive={pathname.startsWith(item.href)}
                                onClick={() => router.push(item.href)}
                                className="justify-start gap-4 text-base h-12"
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
                <div className="bg-black/80 rounded-lg p-2 mt-4">
                    <SidebarMenu>
                        <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Store</p>
                        {userMenuItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    href={item.href}
                                    isActive={pathname.startsWith(item.href)}
                                    onClick={() => router.push(item.href)}
                                    className="justify-start gap-4 text-base h-12"
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
                <div className="bg-black/80 rounded-lg p-2 mt-4">
                    <SidebarMenu>
                        <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                        {adminMenuItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    href={item.href}
                                    isActive={pathname.startsWith(item.href)}
                                    onClick={() => router.push(item.href)}
                                    className="justify-start gap-4 text-base h-12"
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
            </div>
            
            <div>
              <RedLineSeparator />
              <div className="bg-black/80 rounded-lg p-2 mt-4">
                  <SidebarMenu>
                      <SidebarMenuItem>
                          <SidebarMenuButton onClick={() => router.push('/help')} className="justify-start gap-4 text-base h-12">
                              <HelpCircle className="h-5 w-5" />
                              <span>Help</span>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} className="justify-start gap-4 text-base h-12">
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  </SidebarMenu>
              </div>
            </div>
        </div>
        
      </SidebarContent>
    </>
  );
}
