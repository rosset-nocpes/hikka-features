import { useQuery } from '@tanstack/react-query';
import { get_miu_chapter_pages } from '@/utils/miu';
import useHikkaManga from './use-hikka-manga';

const useReadChapterData = (chapter_id: string, chapter_url: string) => {
  const { data } = useHikkaManga();

  return useQuery({
    queryKey: [
      'read-chapter-data',
      `${data.title_original}-${data.year}-${chapter_id}`,
    ],
    queryFn: async () => {
      const r = await get_miu_chapter_pages(chapter_url);

      return { images: r } as API.ReadChapterData;
    },
    retry: false,
    staleTime: Infinity,
  });
};

export default useReadChapterData;
