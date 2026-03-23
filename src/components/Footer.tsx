
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
  WifiOff,
  Cpu,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Global Footer Component
 * Optimized for mobile stacking and desktop grid layout.
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
    <footer className="bg-[#141414] text-white py-12 md:py-24 border-t border-white/5 w-full mt-auto relative overflow-hidden">
      <div className="absolute inset-0 hardware-grid-overlay opacity-[0.03] pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16 mb-16">
          <div className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="inline-block" title="hobbydork home">
              <Image 
                src="/hobbydork-main.png" 
                alt="hobbydork" 
                width={200} 
                height={42} 
                className="h-10 md:h-14 w-auto" 
              />
            </Link>
            <p className="text-white/60 text-[10px] md:text-sm leading-relaxed font-bold uppercase tracking-widest max-w-xs">
              The definitive social marketplace for serious collectors. Built on trust, speed, and community protocols.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/5 p-2 rounded-lg border border-white/10" title="Security Protocol">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10" title="Verified Network">
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-black mb-6 text-accent uppercase tracking-widest text-[10px] flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" /> Navigation
            </h4>
            <ul className="text-[10px] md:text-xs space-y-4 text-white/80 font-black uppercase tracking-wider">
              <li><Link href="/listings" className="hover:text-accent transition-colors">Global Catalog</Link></li>
              <li><Link href="/iso24" className="hover:text-accent transition-colors">ISO24 Requests</Link></li>
              <li><Link href="/trust-board" className="hover:text-accent transition-colors">Trust Board</Link></li>
              <li><Link href="/hobbydork-store" className="hover:text-accent transition-colors">Marketplace Store</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-black mb-6 text-accent uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Scale className="w-3 h-3" /> Legal & Policy
            </h4>
            <ul className="text-[10px] md:text-xs space-y-4 text-white/80 font-black uppercase tracking-wider">
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/seller-agreement" className="hover:text-accent transition-colors">Seller Agreement</Link></li>
              <li><Link href="/fees" className="hover:text-accent transition-colors">Fee Structure</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-black mb-6 text-accent uppercase tracking-widest text-[10px] flex items-center gap-2">
              <LifeBuoy className="w-3 h-3" /> Support
            </h4>
            <ul className="text-[10px] md:text-xs space-y-4 text-white/80 font-black uppercase tracking-wider mb-8">
              <li><Link href="/help" className="hover:text-accent transition-colors">Help Center</Link></li>
              <li><Link href="/report-issue" className="hover:text-accent transition-colors">Report Violation</Link></li>
              <li><Link href="/creed" className="hover:text-accent transition-colors">About Us</Link></li>
            </ul>
            
            <div className="pt-4 border-t border-white/5 space-y-4 w-full">
              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3 h-3" /> System Status
              </p>
              <div 
                className={cn(
                  "w-full font-black uppercase text-[10px] tracking-widest h-12 rounded-xl transition-all duration-500 flex items-center justify-center gap-2 shadow-lg",
                  isOnline 
                    ? "bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)]" 
                    : "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                )}
              >
                {isOnline ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
                NODE_{isOnline ? 'ACTIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[8px] md:text-[9px] text-white/20 uppercase font-black tracking-widest text-center">
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
