import { useState } from 'react';

import { useLiveQuery } from '@/hooks/use-live-query';
import { convexApi } from '@/utils/convex-api';
import { liveConvex } from '@/utils/convex-client';

/**
 * Whether the account shares its activity with friends, followed live, so a
 * switch in the popup and one on hikka.io agree. `shared` is undefined until
 * known; `pending` while a change is on its way.
 */
export function useActivitySharing() {
  const settings = useLiveQuery(convexApi.activity.settings, {});
  const shared = settings?.data?.shareActivity;
  const [pending, setPending] = useState<boolean>();

  const setShared = (shareActivity: boolean) => {
    setPending(shareActivity);
    // Settles once the live query shows it.
    void liveConvex
      .mutation(convexApi.activity.setSharing, { shareActivity })
      .catch(console.error)
      .finally(() => setPending(undefined));
  };

  return {
    shared: pending ?? shared,
    pending: pending !== undefined,
    /** Why the setting couldn't be loaded; the switch then can't be used. */
    error: settings?.error,
    setShared,
  };
}
