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
  PlusCircle,
  LogOut,
  Search,
  Heart,
  Star,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '@/lib/auth';
import { Badge } from '../ui/badge';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/orders', label: 'My Orders', icon: Package },
  { href: '/chat', label: 'Community Chat', icon: MessageSquare },
];

const userMenuItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const favoritesMenuItems = [
    { href: '/watchlist', label: 'Watchlist', icon: Star },
    { href: '/favorites', label: 'Favorite Stores', icon: Heart },
]

export default function SidebarNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

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
            {user?.storeId ? (
                <SidebarMenuItem>
                    <SidebarMenuButton href={`/store/${user.storeId}`} tooltip="My Storefront">
                        <Store />
                        <span>My Storefront</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ) : (
                <SidebarMenuItem>
                    <SidebarMenuButton href="/store/create" tooltip="Create Store">
                        <PlusCircle />
                        <span>Create Store</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
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
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>


      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {user?.status === 'LIMITED' && (
             <div className="p-2 text-center bg-yellow-900/50 border border-yellow-700 rounded-lg mb-2 mx-2">
                 <Badge variant="destructive" className="bg-yellow-500 text-black mb-2">LIMITED ACCESS</Badge>
                <p className="text-xs text-yellow-300">Verify your email to list items and get full access.</p>
             </div>
          )}
          {userMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
