"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, Heart, MessageSquare, User, History, Settings } from "lucide-react";

const buyerLinks = [
  { href: "/buyer/dashboard", label: "Overview", icon: Home },
  { href: "/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/watchlist", label: "Watchlist", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/activity", label: "Activity", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/", label: "Home", icon: Home },
];

import { useAuth } from "@/hooks/use-auth";
export default function BuyerSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <aside className="w-56 min-h-screen bg-sidebar text-sidebar-foreground border-r border-gray-800 flex flex-col py-6 px-2 gap-2">
      <nav className="flex flex-col gap-1">
        {buyerLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-muted/60",
              pathname === href ? "bg-muted text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
