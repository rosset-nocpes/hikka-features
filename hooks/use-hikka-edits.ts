import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/entrypoints/content';
import { usePageStore } from './use-page-store';

export const hikkaPendingEditsFetcher = async (
  page: number,
  sort: string[],
) => {
  const r = await fetch(`https://api.hikka.io/edit/list?page=${page}&size=15`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sort,
      status: 'pending',
      slug: '',
    }),
  });

  if (!r.ok) {
    throw new Error('Not found');
  }

  return r.json();
};

type EditItem = { edit_id: number };

type PendingEditsResponse = {
  pagination: { total: number; pages: number };
  list: EditItem[];
};

const NextEditURL = async (edit_id: string): Promise<string> => {
  const id = Number(edit_id);
  const params = new URLSearchParams(document.location.search);
  const sortDirection =
    params.get('reverse') !== null ? 'created:asc' : 'created:desc';

  const pendingEdits = (await hikkaPendingEditsFetcher(1, [
    sortDirection,
  ])) as PendingEditsResponse;

  if (pendingEdits.pagination.total === 0 || pendingEdits.list.length === 1)
    return '';

  const first_edit_pos = pendingEdits.list
    .map((e: EditItem) => e.edit_id)
    .indexOf(id);

  if (first_edit_pos === -1) {
    for (let i = 2; i <= pendingEdits.pagination.pages; i++) {
      const pageResp = (await hikkaPendingEditsFetcher(i, [
        sortDirection,
      ])) as PendingEditsResponse;
      const { list } = pageResp;

      const found_edit_pos = list.map((e: EditItem) => e.edit_id).indexOf(id);

      if (found_edit_pos === -1) continue;

      if (
        found_edit_pos + 1 === list.length &&
        pendingEdits.pagination.pages === i
      ) {
        params.get('reverse') === null
          ? params.set('reverse', 'true')
          : params.delete('reverse');

        history.replaceState(
          null,
          '',
          `${document.location.pathname}${
            params.toString() ? `?${params.toString()}` : ''
          }`,
        );

        return await NextEditURL(edit_id);
      } else if (found_edit_pos + 1 === list.length) {
        const nextPageResp = (await hikkaPendingEditsFetcher(i + 1, [
          sortDirection,
        ])) as PendingEditsResponse;

        return `https://hikka.io/edit/${nextPageResp.list[0].edit_id}${
          params.toString() ? `?${params.toString()}` : ''
        }`;
      } else {
        return `https://hikka.io/edit/${list[found_edit_pos + 1].edit_id}${
          params.toString() ? `?${params.toString()}` : ''
        }`;
      }
    }

    return '';
  } else if (first_edit_pos + 1 === pendingEdits.list.length) {
    params.get('reverse') === null
      ? params.set('reverse', 'true')
      : params.delete('reverse');

    history.replaceState(
      null,
      '',
      `${document.location.pathname}${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    );

    return await NextEditURL(edit_id);
  } else {
    return `https://hikka.io/edit/${
      pendingEdits.list[first_edit_pos + 1].edit_id
    }${params.toString() ? `?${params.toString()}` : ''}`;
  }
};

const useHikkaEdits = () => {
  return useQuery({
    queryKey: ['hikka-edits-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => NextEditURL(queryKey[1]),
    retry: false,
    staleTime: Infinity,
  });
};

export const prefetchHikkaEdits = () => {
  return queryClient.prefetchQuery({
    queryKey: ['hikka-edits-data', usePageStore.getState().slug!],
    queryFn: ({ queryKey }) => NextEditURL(queryKey[1]),
  });
};

export default useHikkaEdits;
