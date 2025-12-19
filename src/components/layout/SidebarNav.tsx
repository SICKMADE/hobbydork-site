
'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

import {
  LogOut,
  Home,
  Search,
  Store,
  MessageSquare,
  Newspaper,
  Heart,
  Settings,
  User,
  Star,
  HelpCircle,
  ShoppingCart,
  Package,
  HeartHandshake,
  Bell,
  History,
  Users,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  orderBy,
  query,
} from 'firebase/firestore';

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

type NotificationDoc = {
  id?: string;
  isRead?: boolean;
  readAt?: any | null;
};

const RedLineSeparator = () => (
  <div className="w-full h-[2px] bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-full mb-2" />
);

export default function SidebarNav() {
  const { user, profile, logout } = useAuth();
  const { isMobile, setOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const displayName = profile?.displayName || user?.email || 'My account';
  const avatarUrl = profile?.avatar ?? '';

  const navigate = (href: string) => {
    if (isMobile) setOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await logout();
    if (isMobile) setOpen(false);
    router.push('/');
  };

  // Notifications for current user
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, user?.uid]);

  const { data: notifications } =
    useCollection<NotificationDoc>(notificationsQuery);

  const unreadNotificationsCount =
    (notifications || []).filter((n) => !n.isRead && !n.readAt).length;

  const mainMenuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Browse', icon: Search },
    { href: '/stores', label: 'Stores', icon: Users },
    { href: '/iso24', label: 'ISO24', icon: Newspaper },
    { href: '/chat', label: 'Community', icon: MessageSquare },
    { href: '/giveaway', label: 'Giveaway', icon: Star },
  ];

  const personalMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/activity', label: 'My Activity', icon: History },
    // Only show orders/sales if seller
    ...(profile?.isSeller
      ? [
          { href: '/orders', label: 'My Orders', icon: Package },
          { href: '/sales', label: 'My Sales', icon: HeartHandshake },
        ]
      : []),
    { href: '/watchlist', label: 'Watchlist', icon: Heart },
    { href: '/favorites', label: 'Favorite Stores', icon: Store },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const sellerMenuItems = [
    { href: '/listings', label: 'My Listings', icon: Store },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminMenuItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: Star },
  ];

  const helpMenuItems = [
    { href: '/help', label: 'Help & FAQ', icon: HelpCircle },
  ];

  return (
    <>
      {/* Profile block at top */}
      <SidebarHeader className="p-4 pt-6">
        {user && (
          <div className="flex items-center gap-3 rounded-lg border bg-[#2c2c2c] px-3 py-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {profile?.isSeller ? 'Seller' : 'Collector'}
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-4">
        <div className="h-full flex flex-col space-y-4 pt-2">
          {/* Main */}
          <div
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Main
              </p>
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className="justify-start gap-4 text-base font-semibold tracking-wide"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* My Stuff */}
          <div
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                My Stuff
              </p>
              {personalMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const showBadge =
                  item.href === '/notifications' &&
                  unreadNotificationsCount > 0;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className="justify-start gap-4 text-base font-semibold tracking-wide"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                          {unreadNotificationsCount > 9
                            ? '9+'
                            : unreadNotificationsCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* If not a seller, show apply button */}
              {!profile?.isSeller && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === '/store/setup'}
                    onClick={() => navigate('/store/setup')}
                    className="justify-start gap-4 text-base font-semibold tracking-wide text-green-600"
                  >
                    <span>Apply to Become a Seller</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </div>

          {/* My Store (seller only) */}
          {profile?.isSeller && (
            <div
            >
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  My Store
                </p>

                {/* Direct link to public store page */}
                {profile?.storeId && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(
                        `/store/${profile.storeId}`,
                      )}
                      onClick={() =>
                        navigate(`/store/${profile.storeId}`)
                      }
                      className="justify-start gap-4 text-base font-semibold tracking-wide"
                    >
                      <Store className="h-5 w-5" />
                      <span>My Store</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {sellerMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.href)}
                        className="justify-start gap-4 text-base font-semibold tracking-wide"
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          )}

          {/* Admin */}
          {profile?.role === 'ADMIN' && (
            <div
            >
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.href)}
                        className="justify-start gap-4 text-base font-semibold tracking-wide"
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          )}

          {/* Help + Logout */}
          <div
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Help & Account
              </p>

              {helpMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className="justify-start gap-4 text-base font-semibold tracking-wide"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="justify-start gap-4 text-base font-semibold tracking-wide"
                >
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
