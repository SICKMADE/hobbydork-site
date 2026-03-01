'use client';

import { useEffect } from 'react';

/**
 * A client component that handles initial theme application from localStorage
 * to prevent hydration mismatches and theme flashing.
 */
export function ThemeHandler() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}
