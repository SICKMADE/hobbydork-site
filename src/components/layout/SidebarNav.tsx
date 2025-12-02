
'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';

import { LogOut } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';

export default function SidebarNav() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
  }

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Explore Sellers' },
    { href: '/store', label: 'Store' },
    { href: '/iso24', label: '24iso Board' },
    { href: '/chat', label: 'Community Chat' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/watchlist', label: 'Wishlist' },
    { href: '/messages', label: 'Messages' },
  ];

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
                className="justify-start gap-3"
              >
                <span className="text-base">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
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
