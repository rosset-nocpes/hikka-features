import { useQuery } from '@tanstack/react-query';
import { get_miu_chapter_pages } from '@/utils/miu';

const useReadChapterData = (title: string, chapterNumber: number) => {
  return useQuery({
    queryKey: ['read-chapter-data', `${title}-${chapterNumber}`],
    queryFn: async () => {
      const r = await get_miu_chapter_pages(title, chapterNumber);

      return { images: r } as API.ReadChapterData;
    },
    retry: false,
  });
};

export default useReadChapterData;
