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
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
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

    return () => {
      unsubscribe();
    };
  }, [queryRef ? (queryRef as any).path?.canonicalString?.() ?? 'q' : 'no-query']);

  return { data, isLoading, error };
}
