
import { Suspense } from 'react';
import ClientStoreSetup from './ClientStoreSetup';

export default function CreateStorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientStoreSetup />
    </Suspense>
  );
}
