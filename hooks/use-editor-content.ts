import { useQuery } from '@tanstack/react-query';

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

      const r = await fetch(
        `${BACKEND_BRANCHES[backendBranch]}/editor/${effectiveType}/${slug}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.EditorContent;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useEditorContent;
