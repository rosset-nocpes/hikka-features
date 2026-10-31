import type { FunctionArgs } from 'convex/server';

import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

import { ActivityReporter } from '../../core/activity-reporter';
import { useReader } from './hooks/use-reader';

type Report = FunctionArgs<typeof convexApi.activity.reportReading>;

const currentReport = (): Report | undefined => {
  const { contentType, slug } = usePageStore.getState();
  const chapter = useReader.getState().currentChapter;
  if (!slug || !chapter || !Number.isFinite(chapter.chapter)) return undefined;
  if (contentType !== 'manga' && contentType !== 'novel') return undefined;
  // Sources number chapters outside any volume as volume 0.
  const { volume } = chapter;
  return {
    contentType,
    slug,
    chapter: chapter.chapter,
    ...(volume && Number.isFinite(volume) && { volume }),
  };
};

/** Tells the user's friends what the open reader shows. */
export const readingReporter = new ActivityReporter<Report>({
  current: currentReport,
  subscribe: (listener) => [useReader.subscribe(listener)],
  report: (report) =>
    convex.accountMutation(convexApi.activity.reportReading, report),
  clear: () => convex.accountMutation(convexApi.activity.clearReading, {}),
});
