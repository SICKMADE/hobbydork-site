
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
  Users,
  Store,
  LayoutList,
  MessageSquare,
  HelpCircle,
  LogOut,
  PlusCircle,
  Heart,
  Settings,
  User,
  Package,
} from 'lucide-react';
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
    { href: '/sellers', label: 'Explore Sellers', icon: Users },
    { href: '/store', label: 'Store', icon: Store },
    { href: '/iso24', label: '24iso Board', icon: LayoutList },
    { href: '/chat', label: 'Community Chat', icon: MessageSquare },
  ];
  
  const accountMenuItems = [
      { href: '/dashboard', label: 'Dashboard', icon: Package },
      { href: '/watchlist', label: 'Wishlist', icon: Heart },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
  ]

  const bottomMenuItems = [
      { href: '/listings/create', label: 'Sell an Item', icon: PlusCircle },
      { href: '/help', label: 'Help & Support', icon: HelpCircle },
  ]

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname === item.href}
                tooltip={item.label}
                onClick={() => router.push(item.href)}
                className="justify-start gap-3"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-base">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <div className="mt-4 px-2">
           <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">My Account</h3>
           <SidebarMenu>
            {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton 
                        href={item.href} 
                        isActive={pathname.startsWith(item.href)}
                        onClick={() => router.push(item.href)} 
                        tooltip={item.label}
                        className="justify-start gap-3"
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
           </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname === item.href}
                tooltip={item.label}
                onClick={() => router.push(item.href)}
                className="justify-start gap-3"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-base">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="justify-start gap-3">
              <LogOut className="h-5 w-5" />
              <span className="text-base">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
