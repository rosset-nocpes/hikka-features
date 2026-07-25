import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import { BACKEND_BRANCHES } from '@/utils/constants';
import { convexApi } from '@/utils/convex-api';
import { CONVEX_URL, convexAction } from '@/utils/convex-client';

const CONTENT_TYPE_MAP: Record<string, string> = {
  person: 'people',
  character: 'characters',
};

const getEditorParams = () => {
  const path = new URLSearchParams(document.location.search);
  const urlSlug = path.get('slug');
  const urlContentType = path.get('content_type');

  if (urlSlug && urlContentType) {
    return { slug: urlSlug, content_type: urlContentType };
  }

  const modal = document.querySelector<HTMLElement>(
    '[data-slug][data-content-type]',
  );

  if (modal) {
    return {
      slug: modal.dataset.slug!,
      content_type: modal.dataset.contentType!,
    };
  }

  return { slug: urlSlug, content_type: urlContentType };
};

const useEditorContent = () => {
  const { backendBranch } = useSettings();
  const { slug, content_type } = getEditorParams();

  return useQuery({
    queryKey: ['editor-content', slug],
    queryFn: async () => {
      const effectiveType =
        CONTENT_TYPE_MAP[content_type as string] ?? content_type;

      if (!slug || !effectiveType) {
        throw new Error('Missing slug or content_type');
      }

      if (
        CONVEX_URL &&
        (effectiveType === 'characters' || effectiveType === 'people')
      ) {
        return await convexAction(convexApi.editor.suggest, {
          type: effectiveType,
          slug,
        });
      }

      return ky
        .get(
          `${BACKEND_BRANCHES[backendBranch]}/editor/${effectiveType}/${slug}`,
        )
        .json<API.EditorContent>();
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useEditorContent;
