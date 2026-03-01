'use client';

import React, { ReactNode } from 'react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b bg-background flex items-center justify-between sticky top-0 z-50">
          <Image 
            src="/hobbydork-main.png" 
            alt="hobbydork" 
            width={160} 
            height={40} 
            className="h-9 w-auto" 
          />
          <SidebarTrigger />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}