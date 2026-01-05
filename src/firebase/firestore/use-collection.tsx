'use client';

import { useEffect, useState } from 'react';
import type {
  Query,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

type WithId<T = DocumentData> = T & { id: string };

type UseCollectionResult<T> = {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
};

export function useCollection<T = DocumentData>(
  queryRef: Query<T> | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!queryRef);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!queryRef) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('useCollection called with null/undefined ref. Skipping Firestore subscription.');
        console.trace('useCollection null ref stack');
      }
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let unsub = null;
    try {
      // Emit a stack trace so we can locate which component/query started this subscription
      // (helps diagnose unexpected Watch stream state from the backend)
      console.trace('Firestore useCollection subscribing', queryRef);
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
          setError(err);
          setIsLoading(false);
        },
      );
    } catch (e: unknown) {
      // onSnapshot can throw synchronously for invalid queries/targets; capture that
      console.error('Firestore onSnapshot failed to subscribe', e);
      setError(e);
      setIsLoading(false);
      return;
    }
    return () => {
      if (unsub) {
        try {
          unsub();
        } catch (e) {
          console.warn('Error unsubscribing Firestore snapshot', e);
        }
      }
    };
  }, [queryRef]);

  return { data, isLoading, error };
}
