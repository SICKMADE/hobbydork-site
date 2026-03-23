'use client';

import { useEffect, useState } from 'react';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import type {
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { useUser } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type WithId<T = DocumentData> = T & { id: string };

type UseCollectionResult<T> = {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: string | null;
};

// Internal helper to extract path for error reporting
interface InternalQuery {
  _query: {
    path?: {
      canonicalString: () => string;
    };
    collectionGroup?: string;
  };
}

export function useCollection<T = DocumentData>(
  memoizedTargetRefOrQuery: Query<T> | null | undefined,
): UseCollectionResult<T> {
  const { isUserLoading: authLoading } = useUser();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setAuthReady(false);
      return;
    }
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (!authReady) return;
    
    if (!memoizedTargetRefOrQuery) {
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
        memoizedTargetRefOrQuery as Query<T>,
        (snap: QuerySnapshot<T>) => {
          const docs: WithId<T>[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as T),
          }));
          setData(docs);
          setIsLoading(false);
        },
        async (serverError: FirestoreError) => {
          if (serverError.code === 'permission-denied') {
            let path = "";
            try {
              const queryObj = memoizedTargetRefOrQuery as any;
              
              if (queryObj.path) {
                path = queryObj.path;
              } else {
                const internal = memoizedTargetRefOrQuery as unknown as InternalQuery;
                const internalPath = internal._query?.path?.canonicalString?.() || "";
                
                if (!internalPath || internalPath === "/" || internalPath.length < 2) {
                  const colGroup = internal._query?.collectionGroup || "unknown_group";
                  path = `[CollectionGroup: ${colGroup}]`;
                } else {
                  path = internalPath;
                }
              }
            } catch (e) {
              path = "firestore/query";
            }

            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path,
            } satisfies SecurityRuleContext);

            errorEmitter.emit('permission-error', contextualError);
          }

          setError(getFriendlyErrorMessage(serverError));
          setIsLoading(false);
        },
      );
    } catch (e: unknown) {
      console.error('Firestore onSnapshot subscription error:', e);
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
  }, [memoizedTargetRefOrQuery, authReady]);

  return { data, isLoading, error };
}
