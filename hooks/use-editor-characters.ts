import { useQuery } from '@tanstack/react-query';

const useEditorCharacters = () => {
  const { backendBranch } = useSettings();

  const path = new URLSearchParams(document.location.search);
  const slug = path.get('slug');

  return useQuery({
    queryKey: ['editor-characters', slug],
    queryFn: async () => {
      const r = await fetch(
        `${BACKEND_BRANCHES[backendBranch]}/editor/characters/${slug}`,
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json()) as API.EditorCharacters;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useEditorCharacters;
