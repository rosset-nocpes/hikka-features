import { useQuery } from '@tanstack/react-query';
import { ReaderType } from '../reader.enums';
import biuScraper from '../services/bakainua';
import miuScraper from '../services/miu';
import { useReader } from './use-reader';

const useReadChapterData = () => {
  const { currentChapter, settings } = useReader();
  const { data } = useHikka();
  const { slug } = usePageStore();
  if (!data || !currentChapter) throw new Error('Reader data not available');

  return useQuery({
    queryKey: ['read-chapter-data', settings.type, slug, currentChapter.id],
    queryFn: async () => {
      const targetScraper =
        settings.type === ReaderType.Manga ? miuScraper : biuScraper;
      const r = await targetScraper.getChapter(currentChapter.url);

      return r;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadChapterData;
