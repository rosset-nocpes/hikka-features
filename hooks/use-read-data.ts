import { useQuery } from '@tanstack/react-query';
import { get_miu_chapters } from '@/utils/miu';
import useHikkaManga from './use-hikka-manga';

const useReadData = () => {
  const { data } = useHikkaManga();

  return useQuery({
    queryKey: ['read-data', data.title_original],
    queryFn: async () => {
      const r = await get_miu_chapters(data.title_original);

      return { chapters: r } as API.ReadData;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadData;
