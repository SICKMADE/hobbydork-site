'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// Client-only Firebase initializer. Always import this from client components only.
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp: FirebaseApp;
    // Always initialize with explicit config on the client to avoid
    // automatic-init attempts that can fail during server prerender.
    // This function is marked 'use client' and should only run in the browser.
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      // If an app with the same name/options already exists, return it.
      try {
        firebaseApp = getApp();
      } catch (inner) {
        // Re-throw the original error if we cannot recover
        throw e;
      }
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
