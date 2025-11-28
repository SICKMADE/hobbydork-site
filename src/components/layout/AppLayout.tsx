
'use client';
import { SidebarProvider, Sidebar, useSidebar } from '@/components/ui/sidebar';
import Header from './Header';
import SidebarNav from './SidebarNav';
import { cn } from '@/lib/utils';

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
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
