import type { FunctionArgs } from 'convex/server';

import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

import { ActivityReporter } from '../../core/activity-reporter';
import { usePlayer } from './context/player-context';
import { useWatchTogether } from './watch-together/use-watch-together';

type Report = FunctionArgs<typeof convexApi.activity.report>;

const currentReport = (): Report | undefined => {
  const { slug, currentEpisode } = usePlayer.getState();
  if (!slug || !currentEpisode) return undefined;
  const roomCode = useWatchTogether.getState().room?.code;
  return {
    animeSlug: slug,
    episode: currentEpisode.episode,
    playing: useIFramePlayer.getState().isPlaying,
    ...(roomCode && { roomCode }),
  };
};

/** Tells the user's friends what the open player shows. */
export const activityReporter = new ActivityReporter<Report>({
  current: currentReport,
  subscribe: (listener) => [
    usePlayer.subscribe(listener),
    useIFramePlayer.subscribe(listener),
    useWatchTogether.subscribe(listener),
  ],
  report: (report) => convex.accountMutation(convexApi.activity.report, report),
  clear: () => convex.accountMutation(convexApi.activity.clear, {}),
});
