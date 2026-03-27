'use client';

import * as React from 'react';
import { Disclosure } from '@/components/ui/Disclosure';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  PlusCircle,
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
  ShoppingBag,
  Zap,
  Gift,
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
  { title: 'Browse', url: '/listings', icon: ShoppingBag },
  { title: 'ISO24', url: '/iso24', icon: Search },
  { title: 'Trust Board', url: '/trust-board', icon: Trophy },
  { title: 'Viral Bounty', url: '/viral-bounty', icon: Zap, isNew: true },
  { title: 'hobbydork store', url: '/hobbydork-store', icon: Crown },
];

const toolsItems = [];

const authItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Community Chat', url: '/community-chat', icon: MessageSquare, isLive: true },
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
  const [isDemo, setIsDemo] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme === 'dark');
    setIsDemo(localStorage.getItem('hobbydork_demo_mode') === 'true');
  }, []);

  const handleNavClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

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

  const isStaff = React.useMemo(() => {
    if (!user) return false;
    if (profile?.role === 'ADMIN' || profile?.role === 'MODERATOR') return true;
    if (user.email?.toLowerCase().includes('admin')) return true;
    if (user.uid === 'admin-uid') return true;
    return false;
  }, [user, profile]);

  const isSeller = !!profile?.isSeller || isDemo;
  const username = profile?.username;
  const userAvatar = profile?.photoURL || getRandomAvatar(user?.uid);

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
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="h-14 flex items-center justify-center border-b px-2">
        {user ? (
          <Link href="/dashboard" className="flex items-center justify-center cursor-pointer" onClick={handleNavClick}>
            <Avatar className="w-10 h-10 border-2 border-primary/10 hover:border-accent transition-all duration-200">
              <AvatarImage src={userAvatar} />
              <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center w-full px-2 overflow-hidden" onClick={handleNavClick}>
             <Image 
               src="/hobbydork-main.png" 
               alt="hobbydork" 
               width={120} 
               height={28} 
               className="h-6 w-auto group-data-[collapsible=icon]:hidden" 
               priority
             />
             <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-8 h-8 bg-zinc-950 rounded-lg border border-white/10 shadow-xl">
                <span className="text-accent font-black text-[10px] italic">HD</span>
             </div>
          </Link>
        )}
      </SidebarHeader>
      
      <SidebarContent className="relative py-2">
        {user && isStaff && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-red-600 font-black uppercase text-[10px]">Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'} className="text-red-600 font-black hover:bg-red-50 h-9" onClick={handleNavClick}>
                  <Link href="/admin"><ShieldAlert className="w-4 h-4" /><span>ADMIN PANEL</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest opacity-50">Marketplace</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} className="h-9" onClick={handleNavClick}>
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-tight">{item.title}</span>
                    {item.isNew && (
                      <span className="ml-auto px-1 py-0.5 rounded bg-accent text-white text-[7px] font-black uppercase tracking-widest group-data-[collapsible=icon]:hidden">NEW</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Tools section temporarily removed */}

        {user && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest opacity-50">Account</SidebarGroupLabel>
            <SidebarMenu>
              {authItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className="h-9" onClick={handleNavClick}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">{item.title}</span>
                      {item.isLive && (
                        <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                          <span className="relative flex h-1 w-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1 w-1 bg-red-500"></span>
                          </span>
                          <span className="text-[8px] font-bold text-red-400 uppercase group-data-[collapsible=icon]:hidden">Live</span>
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarSeparator className="my-2" />

        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest opacity-50">Selling</SidebarGroupLabel>
          <SidebarMenu>
            {user ? (
              isSeller ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === `/storefronts/${username}`} className="h-9" onClick={handleNavClick}>
                      <Link href={username ? `/storefronts/${username}` : "/dashboard"}>
                        <Store className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">My Storefront</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="h-9" isActive={pathname === '/listings/create'} onClick={handleNavClick}>
                      <Link href="/listings/create">
                        <PlusCircle className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">New Listing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="h-9" isActive={pathname === '/giveaways/create'} onClick={handleNavClick}>
                      <Link href="/giveaways/create">
                        <Gift className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Create Giveaway</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/seller/settings'} className="h-9" onClick={handleNavClick}>
                      <Link href="/seller/settings">
                        <Palette className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Storefront Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-black h-10 rounded-lg" onClick={handleNavClick}>
                    <Link href="/seller/onboarding" className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" /><span className="text-[10px] uppercase tracking-widest">Become Seller</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-[10px] text-muted-foreground italic h-9" onClick={handleNavClick}>
                  <Link href="/login">Sign in to start selling</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t space-y-3">
        {/* Collapsed on mobile, expanded on desktop */}
        <div className="block md:hidden">
          <Disclosure>
            {({ open }) => (
              <>
                <button className="flex items-center gap-2 w-full text-left text-[11px] font-bold uppercase tracking-tight py-2 px-2 rounded hover:bg-muted transition-colors" aria-expanded={open ? "true" : "false"}>
                  <Settings className="w-4 h-4" />
                  More
                  <span className="ml-auto">{open ? '−' : '+'}</span>
                </button>
                <Disclosure.Panel>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {user && (
                      <SidebarMenuButton asChild isActive={pathname === '/settings'} className="h-9" onClick={handleNavClick}>
                        <Link href="/settings"><Settings className="w-4 h-4" /><span className="text-[11px] font-bold uppercase tracking-tight">Settings</span></Link>
                      </SidebarMenuButton>
                    )}
                    <SidebarMenuButton asChild isActive={pathname === '/creed'} className="h-8" onClick={handleNavClick}>
                      <Link href="/creed"><Info className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-tight">About Us</span></Link>
                    </SidebarMenuButton>
                    <SidebarMenuButton asChild isActive={pathname === '/help'} className="h-8" onClick={handleNavClick}>
                      <Link href="/help"><HelpCircle className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-tight">Help Center</span></Link>
                    </SidebarMenuButton>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
        <div className="hidden md:block">
          {user && (
            <SidebarMenuButton asChild isActive={pathname === '/settings'} className="h-9" onClick={handleNavClick}>
              <Link href="/settings"><Settings className="w-4 h-4" /><span className="text-[11px] font-bold uppercase tracking-tight">Settings</span></Link>
            </SidebarMenuButton>
          )}
          <div className="flex flex-col gap-0.5">
            <SidebarMenuButton asChild isActive={pathname === '/creed'} className="h-8" onClick={handleNavClick}>
              <Link href="/creed"><Info className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-tight">About Us</span></Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild isActive={pathname === '/help'} className="h-8" onClick={handleNavClick}>
              <Link href="/help"><HelpCircle className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-tight">Help Center</span></Link>
            </SidebarMenuButton>
          </div>
        </div>
        {user && (
          <SidebarMenuButton onClick={handleSignOut} className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 !text-red-700 dark:!text-red-400 border border-red-200 dark:border-red-900/50 font-black rounded-lg h-10">
            <LogOut className="w-4 h-4" /><span className="text-[10px] uppercase tracking-widest">Sign Out</span>
          </SidebarMenuButton>
        )}
        <div className="flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {mounted && isDark ? <Moon className="w-3.5 h-3.5 text-accent" /> : <Sun className="w-3.5 h-3.5 text-yellow-500" />}
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-data-[collapsible=icon]:hidden">
              {mounted ? (isDark ? 'Dark' : 'Light') : 'Light'}
            </span>
          </div>
          <Switch 
            checked={isDark} 
            onCheckedChange={toggleTheme} 
            className="h-4 w-8 data-[state=checked]:bg-accent"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
