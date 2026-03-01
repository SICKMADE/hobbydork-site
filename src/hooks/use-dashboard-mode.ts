import { useState, useEffect } from 'react';

export type DashboardMode = 'buyer' | 'seller';

export function useDashboardMode(defaultMode: DashboardMode = 'buyer') {
  const [mode, setMode] = useState<DashboardMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboardMode');
      if (stored === 'buyer' || stored === 'seller') return stored;
    }
    return defaultMode;
  });

  useEffect(() => {
    localStorage.setItem('dashboardMode', mode);
  }, [mode]);

  return [mode, setMode] as const;
}
