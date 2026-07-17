import { useQuery } from "@tanstack/react-query";

const CONTENT_TYPE_TO_API: Record<string, string> = {
  character: 'characters',
  person: 'people',
};

const useHikkaContent = (
  slug?: string | null,
  contentType?: string | null,
) => {
  const mappedType = contentType
    ? (CONTENT_TYPE_TO_API[contentType] ?? contentType)
    : undefined;

  return useQuery({
    queryKey: ['hikka-content', mappedType, slug],
    queryFn: async () => {
      const r = await fetch(`https://api.hikka.io/${mappedType}/${slug}`);
      if (!r.ok) throw new Error('Not found');
      return r.json();
    },
    retry: false,
    staleTime: Infinity,
    enabled: !!slug && !!mappedType,
  });
};

export default useHikkaContent;
