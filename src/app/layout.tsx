import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase"
import { ThemeHandler } from "@/components/ThemeHandler"
import { MainLayoutWrapper } from "@/components/MainLayoutWrapper"
import { GoogleAnalytics } from "@/lib/analytics"

export const metadata: Metadata = {
  title: {
    default: 'hobbydork | Built for Collectors',
    template: '%s | hobbydork'
  },
  description: 'The community-driven destination for serious collectors. Trade, track, and talk shop with the most passionate collectors on the planet.',
  keywords: ['collectibles', 'trading cards', 'vintage watches', 'auctions', 'rare toys', 'collector community', 'hobby shop'],
  authors: [{ name: 'hobbydork' }],
  creator: 'hobbydork',
  publisher: 'hobbydork',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hobbydork.com',
    siteName: 'hobbydork',
    title: 'hobbydork | Built for Collectors',
    description: 'A safe, transparent social marketplace for high-end collectibles.',
    images: [
      {
        url: '/hobbydork-main.png',
        width: 1200,
        height: 630,
        alt: 'hobbydork - Where Collectors Connect',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'hobbydork | Built for Collectors',
    description: 'A safe, transparent social marketplace for high-end collectibles.',
    images: ['/hobbydork-main.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen overflow-x-hidden">
        <GoogleAnalytics />
        <ThemeHandler />
        <FirebaseClientProvider>
          <MainLayoutWrapper>
            {children}
          </MainLayoutWrapper>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
