'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  query,
  orderBy,
} from 'firebase/firestore';

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

const RedLineSeparator = () => (
  <div className="h-0.5 w-full bg-red-600" />
);

type NotificationDoc = {
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  createdAt?: any;
  readAt?: any | null;
  isRead?: boolean;
};

export default function SidebarNav() {
  const { user, logout, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const firestore = useFirestore();

  const handleLogout = async () => {
    await logout();
  };

  const isSeller = !!profile?.isSeller && !!profile?.storeId;
  const role = (profile as any)?.role as string | undefined;

  const currentPath = pathname ?? '';

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, user?.uid]);

  const { data: notifications } =
    useCollection<NotificationDoc>(notificationsQuery as any);

  const unreadNotificationsCount =
    (notifications || []).filter((n) => !n.isRead && !n.readAt).length;

  const mainMenuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Browse', icon: Search },
    { href: '/iso24', label: 'ISO24', icon: Newspaper },
    { href: '/chat', label: 'Community', icon: MessageSquare },
  ];

  const personalMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/orders', label: 'My Orders', icon: Package },
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
    { href: '/admin', label: 'Admin Dashboard', icon: Settings },
    { href: '/admin/users', label: 'Manage Users', icon: User },
    { href: '/admin/spotlight', label: 'Spotlight', icon: Star },
  ];

  const displayName =
    (profile as any)?.displayName ||
    user?.email ||
    'My account';

  const avatarUrl =
    (profile as any)?.avatarUrl || '';

  return (
    <>
      {/* Profile block at top */}
      <SidebarHeader className="p-4 pt-6">
        {user && (
          <div className="flex items-center gap-3 rounded-lg border bg-background/80 px-3 py-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {isSeller ? 'Seller' : 'Collector'}
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-4">
        <div className="h-full flex flex-col space-y-4 pt-2">
          {/* Main */}
          <div
            className="bg-background rounded-lg p-2"
            style={{
              boxShadow:
                'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)',
            }}
          >
            <SidebarMenu>
              <RedLineSeparator />
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={currentPath === item.href}
                    onClick={() => router.push(item.href)}
                    className="justify-start gap-4 text-base font-semibold tracking-wide"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>

          {/* My Vault */}
          <div
            className="bg-background rounded-lg p-2"
            style={{
              boxShadow:
                'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)',
            }}
          >
            <SidebarMenu>
              <RedLineSeparator />
              <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                My Vault
              </p>
              {personalMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={currentPath.startsWith(item.href)}
                    onClick={() => router.push(item.href)}
                    className="justify-start gap-4 text-base font-semibold tracking-wide"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">
                      {item.label}
                    </span>
                    {item.href === '/notifications' &&
                      unreadNotificationsCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-600 text-[10px] font-bold px-1.5 py-0.5 text-white">
                          {unreadNotificationsCount > 9
                            ? '9+'
                            : unreadNotificationsCount}
                        </span>
                      )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* My Sales – sellers only */}
              {isSeller && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPath.startsWith('/sales')}
                    onClick={() => router.push('/sales')}
                    className="justify-start gap-4 text-base font-semibold tracking-wide"
                  >
                    <HeartHandshake className="h-5 w-5" />
                    <span className="flex-1">My Sales</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </div>

          {/* My Store */}
          {user && (
            <div
              className="bg-background rounded-lg p-2"
              style={{
                boxShadow:
                  'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)',
              }}
            >
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  My Store
                </p>

                {isSeller ? (
                  <>
                    {/* Link to your store page */}
                    {profile?.storeId && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={currentPath.startsWith(`/store/${profile.storeId}`)}
                          onClick={() =>
                            router.push(`/store/${profile.storeId}`)
                          }
                          className="justify-start gap-4 text-base font-semibold tracking-wide"
                        >
                          <Store className="h-5 w-5" />
                          <span>My Store</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {sellerMenuItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={currentPath.startsWith(item.href)}
                          onClick={() => router.push(item.href)}
                          className="justify-start gap-4 text-base font-semibold tracking-wide"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </>
                ) : (
                  // Not a seller → Become a seller
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPath.startsWith('/store/setup')}
                      onClick={() =>
                        router.push('/store/setup?redirect=/listings')
                      }
                      className="justify-start gap-4 text-base font-semibold tracking-wide"
                    >
                      <Store className="h-5 w-5" />
                      <span>Become a seller</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </div>
          )}

          {/* Admin (admin + moderators) */}
          {(role === 'ADMIN' || role === 'MODERATOR') && (
            <div
              className="bg-background rounded-lg p-2"
              style={{
                boxShadow:
                  'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)',
              }}
            >
              <SidebarMenu>
                <RedLineSeparator />
                <p className="px-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={currentPath.startsWith(item.href)}
                      onClick={() => router.push(item.href)}
                      className="justify-start gap-4 text-base font-semibold tracking-wide"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          )}

          {/* Help / Logout */}
          <div
            className="bg-background rounded-lg p-2"
            style={{
              boxShadow:
                'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)',
            }}
          >
            <SidebarMenu>
              <RedLineSeparator />
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/help')}
                  className="justify-start gap-4 text-base font-semibold tracking-wide"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>Help</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
