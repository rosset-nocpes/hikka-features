import { useQuery } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { convexAction } from '@/utils/convex-client';

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
  const { slug, content_type } = getEditorParams();

  return useQuery({
    queryKey: ['editor-content', slug],
    queryFn: async () => {
      const effectiveType =
        CONTENT_TYPE_MAP[content_type as string] ?? content_type;

      if (!slug || !effectiveType) {
        throw new Error('Missing slug or content_type');
      }

      if (effectiveType !== 'characters' && effectiveType !== 'people') {
        throw new Error('Unsupported content type');
      }

      return await convexAction(convexApi.editor.suggest, {
        type: effectiveType,
        slug,
      });
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useEditorContent;
