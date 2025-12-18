
import React, { Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ClientSearch from './ClientSearch';

export const dynamic = 'force-dynamic';

export default function BrowsePage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-6">Loading search…</div>}>
        <ClientSearch />
      </Suspense>
    </AppLayout>
  );
}
