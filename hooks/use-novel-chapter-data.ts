import { useQuery } from '@tanstack/react-query';
import { useNovelReader } from '@/entrypoints/content/modules/novel-reader/context/novel-reader-context';
import biuScraper from '@/utils/scrapers/bakainua';

const useNovelChapterPage = () => {
  const { data } = useHikkaNovel();
  const { currentChapter } = useNovelReader();

  return useQuery({
    queryKey: [
      'novel-chapter-data',
      `${data.title_original}-${data.year}-${currentChapter?.volume}-${currentChapter?.chapter}`,
    ],
    queryFn: async () => {
      if (!currentChapter) {
        throw new Error('No current chapter');
      }

      const r = await biuScraper.getChapter(currentChapter.url);

      return r;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useNovelChapterPage;
