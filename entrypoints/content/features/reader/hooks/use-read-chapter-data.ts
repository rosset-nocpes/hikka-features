import { useQuery } from '@tanstack/react-query';

import { ReaderType } from '../reader.enums';
import biuScraper from '../services/bakainua';
import miuScraper from '../services/miu';
import { useReader } from './use-reader';

/** The open chapter: manga page images or a novel chapter's HTML. */
const useReadChapterData = () => {
  const { currentChapter, settings } = useReader();
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['read-chapter-data', settings.type, slug, currentChapter?.id],
    queryFn: async () =>
      await (
        settings.type === ReaderType.Manga ? miuScraper : biuScraper
      ).getChapter(currentChapter!.url),
    enabled: !!currentChapter,
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadChapterData;
