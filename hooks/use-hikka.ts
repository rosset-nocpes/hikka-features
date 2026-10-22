import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

export const HIKKA_API = 'https://api.hikka.io';

/** API collections of the content types that pages and edits name. */
const API_PATHS: Record<string, string> = {
  character: 'characters',
  person: 'people',
};

/** Pages whose second path segment is content the API serves. */
const PAGE_TYPES = new Set([
  'anime',
  'manga',
  'novel',
  'characters',
  'person',
  'edit',
]);

export const hikkaApiPath = (contentType: string) =>
  API_PATHS[contentType] ?? contentType;

export const fetchHikka = <T = any>(path: string) =>
  ky.get(`${HIKKA_API}/${path}`).json<T>();

/** Content from the Hikka API (an anime, a character, an edit…), kept for the page's life. */
export const useHikkaContent = (
  contentType?: string | null,
  slug?: string | null,
) => {
  const path = contentType ? hikkaApiPath(contentType) : undefined;
  return useQuery({
    queryKey: ['hikka', path, slug],
    queryFn: () => fetchHikka(`${path}/${slug}`),
    enabled: !!path && !!slug,
    retry: false,
    staleTime: Infinity,
  });
};

/**
 * What the current hikka.io page shows. A new edit's page shows the content
 * it is for, named in its query.
 */
const useHikka = () => {
  const { contentType, slug } = usePageStore();
  const params =
    contentType === 'edit' && slug === 'new'
      ? new URLSearchParams(location.search)
      : undefined;

  return useHikkaContent(
    params
      ? params.get('content_type')
      : contentType && PAGE_TYPES.has(contentType)
        ? contentType
        : undefined,
    params ? params.get('slug') : slug,
  );
};

export default useHikka;
