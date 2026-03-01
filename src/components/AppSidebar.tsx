'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  PlusCircle,
  Gift,
  Settings,
  Search,
  Crown,
  MessageSquare,
  Mail,
  UserCheck,
  ShieldAlert,
  Bell,
  Info,
  Trophy,
  HelpCircle,
  Palette,
  Sun,
  Moon,
  Store,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

const navItems = [
  { title: 'Explore', url: '/', icon: Home },
  { title: 'Trust Board', url: '/trust-board', icon: Trophy },
  { title: 'About Us', url: '/creed', icon: Info },
  { title: 'Help Center', url: '/help', icon: HelpCircle },
  { title: 'hobbydork Store', url: '/hobbydork-store', icon: Crown },
];

const authItems = [
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'ISO24', url: '/iso24', icon: Search },
  { title: 'Community Chat', url: '/community-chat', icon: MessageSquare },
  { title: 'Messages', url: '/messages', icon: Mail },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const isDemo = typeof window !== 'undefined' && localStorage.getItem('hobbydork_demo_mode') === 'true';
  const isStaff = !!(profile && (profile.role === 'ADMIN' || profile.role === 'MODERATOR'));
  const isSeller = !!profile?.isSeller || isDemo;
  const username = profile?.username;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 flex items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Image 
            src="/hobbydork-main.png" 
            alt="hobbydork" 
            width={160} 
            height={40} 
            className="h-9 w-auto dark:brightness-0 dark:invert" 
          />
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {user && isStaff && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-600 font-black uppercase">Authority</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'} className="text-red-600 font-black hover:bg-red-50">
                  <Link href="/admin"><ShieldAlert className="w-4 h-4" /><span>ADMIN PANEL</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link href={item.url}><item.icon className="w-4 h-4" /><span>{item.title}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>My Vault</SidebarGroupLabel>
            <SidebarMenu>
              {authItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}><item.icon className="w-4 h-4" /><span>{item.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Seller Hub</SidebarGroupLabel>
          <SidebarMenu>
            {user ? (
              isSeller ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === `/shop/${username}`} className="mb-2">
                      <Link href={username ? `/shop/${username}` : "/dashboard"}>
                        <Store className="w-4 h-4" />
                        <span>My Store</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="bg-accent/5 text-accent font-bold mb-2">
                      <Link href="/listings/create">
                        <PlusCircle className="w-4 h-4" />
                        <span>New Listing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="bg-primary/5 text-primary font-bold mb-2">
                      <Link href="/giveaways/create">
                        <Gift className="w-4 h-4" />
                        <span>New Giveaway</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/seller/settings'} className="hover:bg-zinc-100">
                      <Link href="/seller/settings">
                        <Palette className="w-4 h-4" />
                        <span>Store Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="bg-accent text-white hover:bg-accent/90 font-black h-12 rounded-xl">
                    <Link href="/seller/onboarding" className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5" /><span>Become Seller</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-muted-foreground italic">
                  <Link href="/login">Sign in to start selling</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t space-y-4">
        {user && (
          <SidebarMenuButton asChild isActive={pathname === '/settings'}>
            <Link href="/settings"><Settings className="w-4 h-4" /><span>My Account</span></Link>
          </SidebarMenuButton>
        )}
        
        <div className="flex items-center justify-between px-2 py-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-data-[collapsible=icon]:hidden">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <Switch 
            checked={isDark} 
            onCheckedChange={toggleTheme} 
            className="data-[state=checked]:bg-accent"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}