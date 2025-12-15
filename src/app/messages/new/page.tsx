
export const dynamic = 'force-dynamic';

import AppLayout from '@/components/layout/AppLayout';
import ClientNewMessage from './ClientNewMessage';

export default function NewMessagePage() {
  return (
    <AppLayout>
      <ClientNewMessage />
    </AppLayout>
  );
}

