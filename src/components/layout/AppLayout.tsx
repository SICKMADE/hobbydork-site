
'use client';
import { SidebarProvider, Sidebar, useSidebar } from '@/components/ui/sidebar';
import Header from './Header';
import SidebarNav from './SidebarNav';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { PanelLeft } from 'lucide-react';
import React from 'react';

function MobileSidebar() {
  const { open, setOpen } = useSidebar();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
         <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          >
          <PanelLeft />
          <span className="sr-only">Toggle Sidebar</span>
          </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-r-0">
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  )
}


function MainContent({ children, hideSidebar }: { children: React.ReactNode, hideSidebar?: boolean }) {
  const { isMobile } = useSidebar();
  return (
    <div
      className={cn(
        'flex flex-col min-h-screen',
        !hideSidebar && 'md:ml-64'
      )}
    >
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

import { usePathname } from 'next/navigation';

type AppLayoutProps = {
  children: React.ReactNode;
  sidebarComponent?: React.ReactNode;
};

export default function AppLayout({ children, sidebarComponent }: AppLayoutProps) {
  const pathname = usePathname();
  // Only hide sidebar if no custom sidebarComponent is provided and on buyer/seller dashboard routes
  const hideSidebar = !sidebarComponent && (pathname?.startsWith('/buyer/dashboard') || pathname?.startsWith('/seller'));
  return (
    <SidebarProvider>
      <div className="relative min-h-svh bg-background">
        {!hideSidebar && (
          <Sidebar>
            {sidebarComponent ? sidebarComponent : <SidebarNav />}
          </Sidebar>
        )}
        <MainContent hideSidebar={hideSidebar}>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
