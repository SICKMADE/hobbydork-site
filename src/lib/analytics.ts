'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    dataLayerPrototype?: any[];
  }
}

export function GoogleAnalytics() {
  useEffect(() => {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayerPrototype = window.dataLayer || [];
    function gtag(...args: any[]) {
      window?.dataLayer?.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: window.location.pathname,
      anonymize_ip: true,
    });

    window.gtag = gtag;
  }, []);

  return null;
}

// Track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
};

// Track e-commerce events
export const trackPurchase = (orderId: string, value: number, currency: string = 'USD') => {
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value,
      currency,
    });
  }
};

export const trackViewItem = (itemId: string, itemName: string, price: number) => {
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          price,
        },
      ],
    });
  }
};

export const trackAddToCart = (itemId: string, itemName: string, price: number) => {
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          price,
        },
      ],
    });
  }
};

export const trackSearch = (searchTerm: string) => {
  if (window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }
};
