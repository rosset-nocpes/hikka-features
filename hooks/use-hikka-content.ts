import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

const CONTENT_TYPE_TO_API: Record<string, string> = {
  character: 'characters',
  person: 'people',
};

const useHikkaContent = (slug?: string | null, contentType?: string | null) => {
  const mappedType = contentType
    ? (CONTENT_TYPE_TO_API[contentType] ?? contentType)
    : undefined;

  return useQuery({
    queryKey: ['hikka-content', mappedType, slug],
    queryFn: async () => {
      return ky.get(`https://api.hikka.io/${mappedType}/${slug}`).json<any>();
    },
    retry: false,
    staleTime: Infinity,
    enabled: !!slug && !!mappedType,
  });
};

export default useHikkaContent;
