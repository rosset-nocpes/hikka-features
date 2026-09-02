import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

const useNotionData = () => {
  const { backendBranch } = useSettings();
  const { slug } = usePageStore();

  return useQuery({
    queryKey: ['notion-data', slug],
    queryFn: async () => {
      return ky
        .get(`${BACKEND_BRANCHES[backendBranch]}/notion/${slug}`)
        .json<API.NotionData>();
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    enabled: !!slug,
  });
};

export default useNotionData;
