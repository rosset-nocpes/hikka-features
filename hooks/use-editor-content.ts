import { useQuery } from '@tanstack/react-query';

const CONTENT_TYPE_MAP: Record<string, string> = {
  person: 'people',
  character: 'characters',
};

const useEditorContent = () => {
  const { backendBranch } = useSettings();

  const path = new URLSearchParams(document.location.search);
  const slug = path.get('slug');
  let content_type = path.get('content_type') as keyof typeof CONTENT_TYPE_MAP;

  return useQuery({
    queryKey: ['editor-content', slug],
    queryFn: async () => {
      content_type = CONTENT_TYPE_MAP[content_type] ?? content_type;

      const r = await fetch(
        `${BACKEND_BRANCHES[backendBranch]}/editor/${content_type}/${slug}`,
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
