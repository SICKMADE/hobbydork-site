
'use client';
import { SidebarProvider, Sidebar, useSidebar } from '@/components/ui/sidebar';
import Header from './Header';
import SidebarNav from './SidebarNav';
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


function MainContent({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  return (
    <div
      className={cn(
        'flex flex-col h-screen transition-all duration-300 ease-in-out',
        { 'md:ml-64': open && !isMobile }
      )}
    >
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="relative min-h-svh bg-background">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <div className="absolute top-3 left-4 z-40 md:hidden">
            <MobileSidebar />
        </div>
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
