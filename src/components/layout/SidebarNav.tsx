
'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  Package,
  MessageSquare,
  User,
  Settings,
  Store,
  LogOut,
  Search,
  Heart,
  Star,
  ShoppingCart,
  LayoutList,
  Flame,
  HelpCircle,
  Tag,
  Shield,
  PlusCircle,
  Award,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { usePathname, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Store as StoreType } from '@/lib/types';


export default function SidebarNav() {
  const { logout, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const firestore = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!firestore || !profile?.storeId) return null;
    return doc(firestore, 'storefronts', profile.storeId);
  }, [firestore, profile?.storeId]);

  const { data: store } = useDoc<StoreType>(storeRef);
  
  const handleLogout = async () => {
    await logout();
  }

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/orders', label: 'My Orders', icon: Package },
    { href: '/chat', label: 'Community Chat', icon: MessageSquare },
    { href: '/iso24', label: 'ISO24', icon: Tag },
  ];
  
  const userMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  
  const favoritesMenuItems = [
      { href: '/watchlist', label: 'Watchlist', icon: Star },
      { href: '/favorites', label: 'Favorite Stores', icon: Heart },
  ]

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname === item.href}
                tooltip={item.label}
                onClick={() => router.push(item.href)}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <div className="mt-4 px-2">
           <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">My Store</h3>
           <SidebarMenu>
            {store && (
              <>
                <SidebarMenuItem>
                    <SidebarMenuButton href={`/store/${store.slug}`} onClick={() => router.push(`/store/${store.slug}`)} tooltip="My Storefront">
                        <Store />
                        <span>My Storefront</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/listings" onClick={() => router.push('/listings')} tooltip="My Listings">
                        <LayoutList />
                        <span>My Listings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/sales" onClick={() => router.push('/sales')} tooltip="My Sales">
                        <Flame />
                        <span>My Sales</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
           </SidebarMenu>
        </div>

        <div className="mt-4 px-2">
           <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">My Favorites</h3>
            <SidebarMenu>
                {favoritesMenuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                        href={item.href}
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        onClick={() => router.push(item.href)}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
        
        {profile?.role === 'ADMIN' && (
          <div className="mt-4 px-2">
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Admin</h3>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton
                    href="/admin/users"
                    isActive={pathname === '/admin/users'}
                    tooltip="Manage Users"
                    onClick={() => router.push('/admin/users')}
                >
                    <Shield />
                    <span>Manage Users</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton
                    href="/admin/spotlight"
                    isActive={pathname === '/admin/spotlight'}
                    tooltip="Manage Spotlight"
                    onClick={() => router.push('/admin/spotlight')}
                >
                    <Award />
                    <span>Manage Spotlight</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}

      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {userMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname === item.href}
                tooltip={item.label}
                onClick={() => router.push(item.href)}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           <SidebarMenuItem>
              <SidebarMenuButton
                href="/help"
                isActive={pathname === '/help'}
                tooltip="Help & FAQ"
                 onClick={() => router.push('/help')}
              >
                <HelpCircle />
                <span>Help / FAQ</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
