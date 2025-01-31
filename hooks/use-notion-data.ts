import { useQuery } from '@tanstack/react-query';

const useNotionData = (slug: string) => {
  return useQuery({
    queryKey: ['notion-data', slug],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[await backendBranch.getValue()]}/notion/${slug}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.NotionData;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useNotionData;
