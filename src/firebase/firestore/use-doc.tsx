'use client';

import { useState, useEffect } from 'react';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & {
  [x: string]: any; id: string 
};

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useDoc<T = unknown>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Delay subscription until auth is settled
  useEffect(() => {
    if (authLoading) {
      setAuthReady(false);
      return;
    }
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(!!memoizedDocRef);
      return;
    }

    if (!user || !memoizedDocRef) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!authReady) {
      setIsLoading(true);
    }
  }, [authLoading, user?.uid, memoizedDocRef, authReady]);

  useEffect(() => {
    // 🔒 HARD GATES — WAIT FOR AUTH TO BE READY
    if (!authReady) return;
    if (!user) return;
    //
    if (!memoizedDocRef) return;

    setIsLoading(true);
    setError(null);

    let unsub: (() => void) | null = null;

    try {
      unsub = onSnapshot(
        memoizedDocRef as DocumentReference<T>,
        (snap: DocumentSnapshot<T>) => {
          if (!snap.exists()) {
            setData(null);
          } else {
            setData({ id: snap.id, ...(snap.data() as T) });
          }
          setIsLoading(false);
        },
        (err) => {
          console.error('Firestore useDoc permission/error', err);
          const friendly = getFriendlyErrorMessage(err);
          setError(typeof err === 'object' && err instanceof Error ? err : new Error(friendly));
          setIsLoading(false);
        },
      );
    } catch (e) {
      console.error('Firestore useDoc subscribe crash', e);
      const friendly = getFriendlyErrorMessage(e);
      setError(e instanceof Error ? e : new Error(friendly));
      setIsLoading(false);
    }

    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, [
    memoizedDocRef,
    user?.uid,
    authReady,
    //
  ]);

  return { data, isLoading, error };
}
