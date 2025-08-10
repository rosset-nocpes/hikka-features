import type { UseQueryResult } from '@tanstack/react-query';

const contentTypeToHook: Record<string, () => UseQueryResult<any, Error>> = {
  anime: useHikkaAnime,
  manga: useHikkaManga,
  novel: useHikkaNovel,
};

const useHikka = () => {
  const { contentType } = usePageStore.getState();

  return contentTypeToHook[contentType!]();
};

export default useHikka;
