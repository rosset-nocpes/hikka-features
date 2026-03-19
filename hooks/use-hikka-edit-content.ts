import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/entrypoints/content';

import { usePageStore } from './use-page-store';

// todo: add edit_id param
export const hikkaEditContentFetcher = async () => {
  const split_path = document.location.pathname.split('/'); // still needed for edit logic
  const creatingEdit = Number.isNaN(parseInt(split_path[2], 10));

  const edit_info = creatingEdit
    ? new URLSearchParams(document.location.search)
    : await (await fetch(`https://api.hikka.io/edit/${split_path[2]}`)).json();

  const content_type = creatingEdit
    ? edit_info.get('content_type')
    : edit_info.content.data_type;

  const editSlug = creatingEdit // 'slug' is already defined from the store
    ? edit_info.get('slug')
    : edit_info.content.slug;

  const data = await (
    await fetch(
      `https://api.hikka.io/${
        content_type === 'character'
          ? 'characters'
          : content_type === 'person'
            ? 'people'
            : content_type
      }/${editSlug}`,
    )
  ).json();

  return data;
};

const useHikkaEditContent = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['hikka-edit-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaEditContentFetcher(),
    retry: false,
    staleTime: Infinity,
    enabled,
  });
};

export const prefetchHikkaEditContent = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-edit-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => hikkaEditContentFetcher(),
  });
};

export default useHikkaEditContent;
