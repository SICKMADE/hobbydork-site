import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import Header from './Header';
import SidebarNav from './SidebarNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // We can read the cookie for the default open state
  // const layout = cookies().get("react-resizable-panels:layout")
  // const defaultLayout = layout ? JSON.parse(layout.value) : undefined

  return (
    <SidebarProvider>
      <div className="bg-background">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
