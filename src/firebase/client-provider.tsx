
'use client';

export const functions: Functions | undefined = (() => {
  try {
    const s = clientSdks();
    return s?.functions ?? undefined;
  } catch (e) {
    return undefined;
  }
})();

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './client-init';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Client-side provider component used in the app root to supply
 * Firebase services via React context.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

// Convenience client-side exports to match older imports in the codebase.
// These are safe to import in modules because they guard for server usage.
let _clientSdks: ReturnType<typeof initializeFirebase> | null = null;
function clientSdks() {
  if (_clientSdks) return _clientSdks;
  if (typeof window === 'undefined') {
    // Accessing client SDKs on the server is invalid; return a noop placeholder.
    return undefined as unknown as ReturnType<typeof initializeFirebase>;
  }
  _clientSdks = initializeFirebase();
  return _clientSdks;
}

import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { FirebaseStorage } from 'firebase/storage';
import type { Functions } from 'firebase/functions';

export const db: Firestore | undefined = (() => {
  try {
    const s = clientSdks();
    return s?.firestore;
  } catch (e) {
    return undefined;
  }
})();

export const auth: Auth | undefined = (() => {
  try {
    const s = clientSdks();
    return s?.auth;
  } catch (e) {
    return undefined;
  }
})();

export const storage: FirebaseStorage | undefined = (() => {
  try {
    const s = clientSdks();
    if (!s) return undefined;
    return getStorage(s.firebaseApp);
  } catch (e) {
    return undefined;
  }
})();



export default FirebaseClientProvider;