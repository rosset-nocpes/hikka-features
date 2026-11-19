import { useQuery } from '@tanstack/react-query';

import { scraperFor } from '../services';
import { useReader } from './use-reader';

/** The open chapter: manga page images or a novel chapter's HTML. */
const useReadChapterData = () => {
  const { currentChapter, settings } = useReader();
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['read-chapter-data', settings.type, slug, currentChapter?.id],
    queryFn: async () =>
      await scraperFor(settings.type).getChapter(currentChapter!.url),
    enabled: !!currentChapter,
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadChapterData;
