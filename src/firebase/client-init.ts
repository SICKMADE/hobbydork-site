"use client";
// Export for compatibility with client-provider.tsx
export function initializeFirebase() {
  return getFirebase();
}
import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

/**
 * SINGLETON Firebase App
 * This guarantees ONE app, ONE auth, ONE firestore, ONE functions
 */

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _functions: Functions | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  if (!getApps().length) {
    _app = initializeApp(firebaseConfig);
  } else {
    _app = getApp();
  }

  return _app;
}

export function getFirebase() {
  const app = getFirebaseApp();
  _auth = _auth || getAuth(app);
  _db = _db || getFirestore(app);
  if (typeof window !== "undefined") {
    // Only enable IndexedDB persistence in production, not on localhost
    if (typeof location !== 'undefined' && location.hostname !== "localhost") {
      import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
        enableIndexedDbPersistence(_db!).catch(() => {});
      });
    }
    try {
      _functions = _functions || getFunctions(app, "us-central1");
    } catch (e) {
      _functions = null;
    }
  } else {
    _functions = null;
  }
  return {
    firebaseApp: app,
    firestore: _db,
    auth: _auth,
    functions: _functions,
  };
}


// Remove legacy exports. Always use getFirebase() or initializeFirebase() at runtime in your components/hooks.
