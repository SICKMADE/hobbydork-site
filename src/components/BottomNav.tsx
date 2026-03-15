'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Search, MessageSquare, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BottomNav - A mobile-exclusive navigation bar.
 * Always present on small screens, hidden on desktop (md:hidden).
 */
export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Catalog', href: '/listings', icon: ShoppingBag },
    { label: 'ISO24', href: '/iso24', icon: Search },
    { label: 'Chat', href: '/community-chat', icon: MessageSquare },
    { label: 'Hub', href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 h-16 safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all active:scale-90 relative",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-accent/10")} />
              <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}