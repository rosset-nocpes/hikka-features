import { useQuery } from '@tanstack/react-query';

const useReadChapterData = (slug: string, chapterId: string) => {
  return useQuery({
    queryKey: ['read-chapter-data', `${slug}-${chapterId}`],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[await backendBranch.getValue()]}/read/${slug}/${chapterId}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.ReadChapterData;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useReadChapterData;
