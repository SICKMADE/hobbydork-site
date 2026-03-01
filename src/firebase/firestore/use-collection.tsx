'use client';

import { useEffect, useState } from 'react';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import type {
  Query,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { useUser } from '@/firebase/provider';

type WithId<T = DocumentData> = T & { id: string };

type UseCollectionResult<T> = {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: string | null;
};

export function useCollection<T = DocumentData>(
  queryRef: Query<T> | null | undefined,
): UseCollectionResult<T> {
  const { user, isUserLoading: authLoading } = useUser();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!queryRef);
  const [error, setError] = useState<string | null>(null);
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
    // 🔒 HARD GATES — prevent subscription unless ready
    if (!authReady) return;
    if (!user) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    if (!queryRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let unsub = null;
    try {
      unsub = onSnapshot(
        queryRef as Query<T>,
        (snap: QuerySnapshot<T>) => {
          const docs: WithId<T>[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as T),
          }));
          setData(docs);
          setIsLoading(false);
        },
        (err) => {
          // IMPORTANT: do NOT throw here – just store the error
          console.error('Firestore useCollection error', err);
          setError(getFriendlyErrorMessage(err));
          setIsLoading(false);
        },
      );
    } catch (e: unknown) {
      // onSnapshot can throw synchronously for invalid queries/targets; capture that
      console.error('Firestore onSnapshot failed to subscribe', e);
      setError(getFriendlyErrorMessage(e));
      setIsLoading(false);
      return;
    }
    return () => {
      if (unsub) {
        try {
          unsub();
        } catch {}
      }
    };
  }, [queryRef, user, authReady]);

  return { data, isLoading, error };
}
