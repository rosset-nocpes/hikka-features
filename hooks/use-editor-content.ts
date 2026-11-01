import { useQuery } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

import { hikkaApiPath } from './use-hikka';

/** The content being edited: named in a new edit's query, or by its dialog. */
const getEditorParams = () => {
  const params = new URLSearchParams(document.location.search);
  const modal = document.querySelector<HTMLElement>(
    '[data-slug][data-content-type]',
  );
  const fromQuery = params.has('slug') && params.has('content_type');
  const slug = fromQuery || !modal ? params.get('slug') : modal.dataset.slug;
  const contentType =
    fromQuery || !modal
      ? params.get('content_type')
      : modal.dataset.contentType;
  return { slug, type: contentType ? hikkaApiPath(contentType) : undefined };
};

const useEditorContent = (enabled = true) => {
  const { slug, type } = getEditorParams();

  return useQuery({
    enabled,
    queryKey: ['editor-content', slug],
    queryFn: async () => {
      if (!slug || (type !== 'characters' && type !== 'people')) {
        throw new Error('Unsupported content type');
      }
      return await convex.action(convexApi.editor.suggest, { type, slug });
    },
    retry: false,
    // The name field and the edit toolbar ask for the same suggestion.
    staleTime: 5 * 60_000,
  });
};

export default useEditorContent;
