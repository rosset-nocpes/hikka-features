import { usePageStore } from './use-page-store';

const useHikka = () => {
  const contentType = usePageStore((s) => s.contentType);
  const slug = usePageStore((s) => s.slug);

  const anime = useHikkaAnime({ enabled: contentType === 'anime' });
  const manga = useHikkaManga({ enabled: contentType === 'manga' });
  const novel = useHikkaNovel({ enabled: contentType === 'novel' });
  const character = useHikkaCharacter({
    enabled: contentType === 'characters',
  });
  const person = useHikkaPerson({ enabled: contentType === 'person' });
  const edit = useHikkaEdit({
    enabled: contentType === 'edit' && slug !== 'new',
  });
  const editCreating = useHikkaEditContent({
    enabled: contentType === 'edit' && slug === 'new',
  });

  if (
    contentType !== 'edit' &&
    contentType !== 'anime' &&
    contentType !== 'manga' &&
    contentType !== 'novel' &&
    contentType !== 'characters' &&
    contentType !== 'person'
  )
    return {
      data: undefined,
      isLoading: false,
      isError: false,
    };

  const map = {
    anime,
    manga,
    novel,
    characters: character,
    person,
    edit,
  } as const;

  if (contentType === 'edit' && slug === 'new') {
    return editCreating;
  }

  return map[contentType];
};

export default useHikka;
