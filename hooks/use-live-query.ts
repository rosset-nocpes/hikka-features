import type { FunctionReference, FunctionReturnType } from 'convex/server';

import { getFunctionName } from 'convex/server';
import { useEffect, useState } from 'react';

import { liveConvex } from '@/utils/convex-client';

interface LiveQueryState<Result> {
  key: string;
  data?: Result;
  error?: Error;
}

/**
 * Follows an account query over the tab's live connection. `data` stays
 * undefined until the first result, and while `args` is `'skip'`.
 */
export function useLiveQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: Query['_args'] | 'skip',
) {
  const key =
    args === 'skip'
      ? undefined
      : JSON.stringify([getFunctionName(query), args]);
  const [state, setState] =
    useState<LiveQueryState<FunctionReturnType<Query>>>();

  useEffect(() => {
    if (key === undefined) return;
    const [, queryArgs] = JSON.parse(key) as [string, Query['_args']];
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    liveConvex.acquire().then(
      ({ client, release }) => {
        if (cancelled) return release();
        const unsubscribe = client.onUpdate(
          query,
          queryArgs,
          (data) => setState({ key, data }),
          (error) => setState({ key, error }),
        );
        cleanup = () => {
          unsubscribe();
          release();
        };
      },
      (error: Error) => {
        if (!cancelled) setState({ key, error });
      },
    );

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // `key` covers the query and its arguments.
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [key]);

  return state?.key === key ? state : undefined;
}
