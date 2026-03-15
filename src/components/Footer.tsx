
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutGrid, 
  Shield, 
  ShieldCheck, 
  Scale, 
  LifeBuoy, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Global Footer Component
 * Provides legal, support, and trust navigation.
 * Includes a solid-color Network Status indicator for maximum visibility.
 */
export function Footer() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <footer className="bg-[#141414] text-white py-16 md:py-24 border-t border-white/5 w-full mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16">
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image 
                src="/hobbydork-main.png" 
                alt="hobbydork" 
                width={240} 
                height={50} 
                className="h-12 md:h-16 w-auto" 
              />
            </Link>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed font-bold uppercase tracking-widest">
              The definitive social marketplace for serious collectors. Built on trust, speed, and community protocols.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-black mb-8 text-accent uppercase tracking-widest text-[10px] flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" /> Navigation
            </h4>
            <ul className="text-xs space-y-4 text-white/80 font-black uppercase tracking-wider">
              <li><Link href="/listings" className="hover:text-accent transition-colors">Global Catalog</Link></li>
              <li><Link href="/iso24" className="hover:text-accent transition-colors">ISO24 Requests</Link></li>
              <li><Link href="/trust-board" className="hover:text-accent transition-colors">Trust Board</Link></li>
              <li><Link href="/hobbydork-store" className="hover:text-accent transition-colors">Marketplace Store</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-8 text-accent uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Scale className="w-3 h-3" /> Legal & Policy
            </h4>
            <ul className="text-xs space-y-4 text-white/80 font-black uppercase tracking-wider">
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/seller-agreement" className="hover:text-accent transition-colors">Seller Agreement</Link></li>
              <li><Link href="/fees" className="hover:text-accent transition-colors">Fee Structure</Link></li>
              <li><Link href="/legal-hub" className="hover:text-accent transition-colors">Compliance Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-8 text-accent uppercase tracking-widest text-[10px] flex items-center gap-2">
              <LifeBuoy className="w-3 h-3" /> Support
            </h4>
            <ul className="text-xs space-y-4 text-white/80 font-black uppercase tracking-wider mb-8">
              <li><Link href="/help" className="hover:text-accent transition-colors">Help Center</Link></li>
              <li><Link href="/report-issue" className="hover:text-accent transition-colors">Report Violation</Link></li>
              <li><Link href="/creed" className="hover:text-accent transition-colors">The Creed</Link></li>
            </ul>
            
            <div className="pt-4 border-t border-white/5 space-y-4">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Protocol Status</p>
              <div 
                className={cn(
                  "w-full font-black uppercase text-[10px] tracking-widest h-12 rounded-xl transition-all duration-500 flex items-center justify-center gap-2 shadow-lg",
                  isOnline 
                    ? "!bg-green-600 !text-white" 
                    : "!bg-red-600 !text-white"
                )}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                Node {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[9px] text-white/20 uppercase font-black tracking-widest">
            &copy; {new Date().getFullYear()} hobbydork. Built for Collectors. Nevada, USA.
          </div>
          <div className="flex items-center gap-6 opacity-20 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="h-6 w-10 bg-white/10 rounded flex items-center justify-center text-[8px] font-black">VISA</div>
            <div className="h-6 w-10 bg-white/10 rounded flex items-center justify-center text-[8px] font-black">STRIPE</div>
            <div className="h-6 w-10 bg-white/10 rounded flex items-center justify-center text-[8px] font-black">AMEX</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
