'use client';
import { Bell, Search } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { Input } from '../ui/input';
import { UserNav } from './UserNav';
import Logo from '../Logo';
import { VaultModal } from '../VaultModal';
import { useState } from 'react';
import { useVault } from '@/lib/vault';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MessageSquare, Package, Tag } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { revealPin, showVaultButton } = useVault();
  const { itemCount } = useCart();
  const router = useRouter();

  
  // Mock notifications
  const notifications = [
    { id: 1, type: 'message', title: 'New Message', description: 'From: Retro Rewind', icon: <MessageSquare className="h-4 w-4 text-muted-foreground" /> },
    { id: 2, type: 'order', title: 'Order Shipped!', description: 'Your order #1234 has shipped.', icon: <Package className="h-4 w-4 text-muted-foreground" /> },
    { id: 3, type: 'iso24', title: 'New ISO24 Comment', description: 'Someone commented on your post.', icon: <Tag className="h-4 w-4 text-muted-foreground" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="hidden md:flex" />
          <div className="hidden md:block">
            <Logo iconOnly />
          </div>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="relative ml-auto flex-1 sm:flex-initial">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
                type="search"
                placeholder="Search collectibles..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={() => router.push('/cart')}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{itemCount}</span>
            )}
            <span className="sr-only">Cart</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                 <Bell className="h-5 w-5" />
                 {notifications.length > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{notifications.length}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Notifications</p>
                  <p className="text-xs text-muted-foreground">You have {notifications.length} new messages</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-2">
                  <div className="pt-1">
                   {notification.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
               <DropdownMenuSeparator />
               <DropdownMenuItem className="justify-center">
                    <p className="text-sm font-medium text-primary">View all notifications</p>
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserNav />
        </div>
      </header>
      <VaultModal open={isVaultModalOpen} onOpenChange={setIsVaultModalOpen} />
    </>
  );
}
