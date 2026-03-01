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
  LogOut,
  User,
  Sparkles,
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { getRandomAvatar } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
  { title: 'Explore', url: '/', icon: Home },
  { title: 'ISO24', url: '/iso24', icon: Search },
  { title: 'Trust Board', url: '/trust-board', icon: Trophy },
  { title: 'hobbydork Store', url: '/hobbydork-store', icon: Crown },
];

const toolsItems = [
  { title: 'AI Price Check', url: '/tools/price-check', icon: Sparkles },
];

const authItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Live Chat', url: '/community-chat', icon: MessageSquare, isLive: true },
  { title: 'Messages', url: '/messages', icon: Mail },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { isMobile, setOpen } = useSidebar();
  const [isDark, setIsDark] = React.useState(false);

  const handleNavClick = () => {
    // Auto-close sidebar on mobile after clicking a nav item
    if (isMobile) {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark'; // Light mode is default on first visit
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

  // Only use custom photo if it's a data: URL (real file upload)
  const isCustomPhoto = profile?.photoURL && profile.photoURL.startsWith('data:');
  const userAvatar = isCustomPhoto ? profile.photoURL : getRandomAvatar(user?.uid);

  const handleSignOut = async () => {
    localStorage.removeItem('hobbydork_demo_mode');
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
    }
    window.location.href = '/';
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        {user ? (
          <Link href="/dashboard" className="flex items-center justify-center">
            <Avatar className="w-12 h-12 border-2 border-primary/10 hover:border-accent transition-colors">
              <AvatarImage src={userAvatar} />
              <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center">
            {/* Empty when signed out */}
          </Link>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        {user && isStaff && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-600 font-black uppercase">Authority</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'} className="text-red-600 font-black hover:bg-red-50" onClick={handleNavClick}>
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
                <SidebarMenuButton asChild isActive={pathname === item.url} onClick={handleNavClick}>
                  <Link href={item.url}><item.icon className="w-4 h-4" /><span>{item.title}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {toolsItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} onClick={handleNavClick}>
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
                  <SidebarMenuButton asChild isActive={pathname === item.url} onClick={handleNavClick}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.isLive && (
                        <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-red-400 uppercase group-data-[collapsible=icon]:hidden">Live</span>
                        </span>
                      )}
                    </Link>
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
                    <SidebarMenuButton asChild isActive={pathname === `/shop/${username}`} className="mb-2" onClick={handleNavClick}>
                      <Link href={username ? `/shop/${username}` : "/dashboard"}>
                        <Store className="w-4 h-4" />
                        <span>My Store</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="bg-accent/5 text-accent font-bold mb-2" onClick={handleNavClick}>
                      <Link href="/listings/create">
                        <PlusCircle className="w-4 h-4" />
                        <span>New Listing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="bg-primary/5 text-primary font-bold mb-2" onClick={handleNavClick}>
                      <Link href="/giveaways/create">
                        <Gift className="w-4 h-4" />
                        <span>New Giveaway</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/seller/settings'} className="hover:bg-zinc-100" onClick={handleNavClick}>
                      <Link href="/seller/settings">
                        <Palette className="w-4 h-4" />
                        <span>Store Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-black h-12 rounded-xl" onClick={handleNavClick}>
                    <Link href="/seller/onboarding" className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5" /><span>Become Seller</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-muted-foreground italic" onClick={handleNavClick}>
                  <Link href="/login">Sign in to start selling</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t space-y-4">
        {user && (
          <SidebarMenuButton asChild isActive={pathname === '/settings'} onClick={handleNavClick}>
            <Link href="/settings"><Settings className="w-4 h-4" /><span>My Account</span></Link>
          </SidebarMenuButton>
        )}
        
        <SidebarMenuButton asChild isActive={pathname === '/creed'} className="text-xs" onClick={handleNavClick}>
          <Link href="/creed"><Info className="w-4 h-4" /><span>About Us</span></Link>
        </SidebarMenuButton>
        <SidebarMenuButton asChild isActive={pathname === '/help'} className="text-xs" onClick={handleNavClick}>
          <Link href="/help"><HelpCircle className="w-4 h-4" /><span>Help Center</span></Link>
        </SidebarMenuButton>
        
        {user && (
          <SidebarMenuButton onClick={handleSignOut} className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 !text-red-700 dark:!text-red-300 border-2 border-red-300 dark:border-red-800/60 font-black rounded-lg h-12">
            <LogOut className="w-5 h-5" /><span>Sign Out</span>
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