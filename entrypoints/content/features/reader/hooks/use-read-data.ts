import { useQuery } from '@tanstack/react-query';
import { ReaderContentMode, ReaderType } from '../reader.enums';
import biuScraper from '../services/bakainua';
import miuScraper from '../services/miu';
import { useReader } from './use-reader';

const useReadData = (type?: ReaderType) => {
  type = type || useReader.getState().settings.type;
  const { data } = useHikka();
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['read-data', type, slug],
    queryFn: async () => {
      const targetScraper = type === ReaderType.Manga ? miuScraper : biuScraper;

      const url = await targetScraper.search(data);
      const r = await targetScraper.getChapterList(url);

      if (
        (r.displayMode === ReaderContentMode.Chapters && !r.chapters.length) ||
        (r.displayMode === ReaderContentMode.Volumes && !r.volumes.length)
      ) {
        throw new Error('No chapters found');
      }

      return r;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadData;
