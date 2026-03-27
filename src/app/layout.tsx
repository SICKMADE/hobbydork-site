import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase"
import { ThemeHandler } from "@/components/ThemeHandler"
import { MainLayoutWrapper } from "@/components/MainLayoutWrapper"
import { GoogleAnalytics } from "@/lib/analytics"
import { SidebarProvider } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: {
    default: 'hobbydork | The Social Marketplace for Collectors',
    template: '%s | hobbydork'
  },
  description: 'Trade, track, and talk storefronts with serious collectors. Built for cards, comics, and rare hobby assets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&family=Orbitron:wght@400..900&family=Big+Shoulders+Stencil+Display:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        <GoogleAnalytics />
        <ThemeHandler />
        <FirebaseClientProvider>
          <SidebarProvider defaultOpen={true}>
            <MainLayoutWrapper>
              {children}
            </MainLayoutWrapper>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
