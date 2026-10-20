import { useQuery } from '@tanstack/react-query';

import { allChapters } from '../chapters';
import { scraperFor } from '../services';
import { useReader } from './use-reader';

/** The title's chapters on the site its reader reads from. */
const useReadData = () => {
  const { slug, contentType } = usePageStore();
  const { data, isLoading } = useHikka();

  const type = contentType || useReader.getState().settings.type;

  return useQuery({
    queryKey: ['read-data', type, slug],
    queryFn: async () => {
      const scraper = scraperFor(type);
      const content = await scraper.getChapterList(await scraper.search(data));
      if (!allChapters(content).length) throw new Error('No chapters found');
      return content;
    },
    enabled: !isLoading && !!data,
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadData;
