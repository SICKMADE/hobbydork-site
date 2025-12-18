
import React, { Suspense } from 'react';
import ClientConversations from './ClientConversations';

export const dynamic = 'force-dynamic';

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading conversations…</div>}>
      <ClientConversations />
    </Suspense>
  );
}
