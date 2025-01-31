import { useQuery } from '@tanstack/react-query';

const useReadData = (slug: string) => {
  return useQuery({
    queryKey: ['read-data', slug],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[await backendBranch.getValue()]}/read/${slug}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.ChapterResponse;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useReadData;
