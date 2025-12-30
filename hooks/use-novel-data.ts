import { useQuery } from '@tanstack/react-query';
import biuScraper from '@/utils/scrapers/bakainua';

const useNovelData = () => {
  const { data } = useHikkaNovel();

  return useQuery({
    queryKey: ['novel-data', `${data.title_original}-${data.year}`],
    queryFn: async () => {
      const title = data.title_ua || data.title_en;
      const novel_url = await biuScraper.search(title);
      const r = await biuScraper.getChapterList(novel_url);
      console.log(r);

      return r;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useNovelData;
