import { useQuery } from '@tanstack/react-query';
import { get_miu_chapter_pages } from '@/utils/miu';
import useHikkaManga from './use-hikka-manga';

const useReadChapterData = (chapterNumber: number) => {
  const title: string = useHikkaManga().data.title_original;

  return useQuery({
    queryKey: ['read-chapter-data', `${title}-${chapterNumber}`],
    queryFn: async () => {
      const r = await get_miu_chapter_pages(title, chapterNumber);

      return { images: r } as API.ReadChapterData;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadChapterData;
