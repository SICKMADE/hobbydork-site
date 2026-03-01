'use client';

import React, { ReactNode } from 'react';
import { useUser } from '@/firebase';
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * MainLayoutWrapper handles sidebar rendering and layout stability.
 * The sidebar is always present but can be hidden during loading.
 */
export function MainLayoutWrapper({ children }: { children: ReactNode }) {
  const { isUserLoading } = useUser();

  return (
    <SidebarProvider defaultOpen={true}>
      {!isUserLoading && <AppSidebar />}
      <SidebarInset className="overflow-x-hidden w-full max-w-full relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}