'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { NotificationToastListener } from "@/components/NotificationToastListener";

/**
 * MainLayoutWrapper handles structural layout consistency.
 * Stability optimized to prevent hydration mismatches.
 */
export function MainLayoutWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen w-full sidebar-width-vars overflow-x-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="relative flex-1 flex flex-col min-w-0 bg-background transition-all duration-300">
        <NotificationToastListener />
        <div className="flex-1 flex flex-col w-full min-h-0">
          <div className="flex-1 w-full max-w-full pb-16 md:pb-0">
            {children}
          </div>
          {mounted && (
            <>
              <Footer />
              <BottomNav />
            </>
          )}
        </div>
      </SidebarInset>
    </div>
  );
}