import { useQuery } from '@tanstack/react-query';
import { get_miu_chapters } from '@/utils/miu';

const useReadData = (title: string) => {
  return useQuery({
    queryKey: ['read-data', title],
    queryFn: async () => {
      const r = await get_miu_chapters(title);

      return { chapters: r } as API.ReadData;
    },
    retry: false,
  });
};

export default useReadData;
