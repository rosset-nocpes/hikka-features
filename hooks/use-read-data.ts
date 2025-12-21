import { useQuery } from '@tanstack/react-query';
import miuScraper from '@/utils/miu';
import useHikkaManga from './use-hikka-manga';

const useReadData = () => {
  const { data } = useHikkaManga();

  return useQuery({
    queryKey: ['read-data', `${data.title_original}-${data.year}`],
    queryFn: async () => {
      const r = await miuScraper.getChapters(data);

      return { chapters: r } as unknown as API.ReadData;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadData;
