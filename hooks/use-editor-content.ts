import { useQuery } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { publicAction } from '@/utils/convex-client';

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

const useEditorContent = () => {
  const { slug, type } = getEditorParams();

  return useQuery({
    queryKey: ['editor-content', slug],
    queryFn: async () => {
      if (!slug || (type !== 'characters' && type !== 'people')) {
        throw new Error('Unsupported content type');
      }
      return await publicAction(convexApi.editor.suggest, { type, slug });
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useEditorContent;
