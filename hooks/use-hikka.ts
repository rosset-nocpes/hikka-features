import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

export const HIKKA_API = 'https://api.hikka.io';

/**
 * What the extension reads of content from the Hikka API: an anime, manga,
 * novel, character, person or edit, so most fields are on some of them only.
 */
export interface HikkaContent {
  slug?: string;
  data_type?: string;
  mal_id?: number | null;
  title_ua?: string | null;
  title_en?: string | null;
  title_ja?: string | null;
  title_original?: string | null;
  name_ua?: string | null;
  name_en?: string | null;
  image?: string | null;
  year?: number | null;
  episodes_total?: number | null;
  chapters?: number | null;
  /** A character's anime and manga. */
  anime_count?: number;
  manga_count?: number;
  external?: { text: string; url: string }[];
  /** An edit's number, type and content, which is what it edits. */
  edit_id?: number;
  content_type?: string;
  content?: HikkaContent;
}

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
  'people',
  'edit',
]);

export const hikkaApiPath = (contentType: string) =>
  API_PATHS[contentType] ?? contentType;

export const fetchHikka = <T>(path: string) =>
  ky.get(`${HIKKA_API}/${path}`).json<T>();

/** Content from the Hikka API (an anime, a character, an edit…), kept for the page's life. */
export const useHikkaContent = (
  contentType?: string | null,
  slug?: string | null,
) => {
  const path = contentType ? hikkaApiPath(contentType) : undefined;
  return useQuery({
    queryKey: ['hikka', path, slug],
    queryFn: () => fetchHikka<HikkaContent>(`${path}/${slug}`),
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
