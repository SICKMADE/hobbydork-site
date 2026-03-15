'use client';

import React, { ReactNode } from 'react';
import { useUser } from '@/firebase';
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";

/**
 * MainLayoutWrapper handles sidebar rendering and layout stability.
 * Now includes a global Footer for a consistent professional experience.
 */
export function MainLayoutWrapper({ children }: { children: ReactNode }) {
  const { isUserLoading } = useUser();

  return (
    <SidebarProvider defaultOpen={true}>
      {!isUserLoading && <AppSidebar />}
      <SidebarInset className="overflow-x-hidden w-full max-w-full relative">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col pb-16 md:pb-0 min-h-screen">
          <div className="flex-1">
            {children}
          </div>
          {/* Global Footer - Surfaced on all pages for consistency */}
          <Footer />
          <BottomNav />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
