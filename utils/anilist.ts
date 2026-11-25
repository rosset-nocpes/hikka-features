import ky from 'ky';

import { ANILIST_GRAPHQL_URL } from '@/constants/links';

/**
 * Runs a query on AniList's GraphQL API and gives its `data`. A title AniList
 * lacks comes back as a 404 that still carries `data` (with it `null`).
 */
export async function queryAniList<Data>(
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await ky.post(ANILIST_GRAPHQL_URL, {
    json: { query, variables },
    throwHttpErrors: (status) => status !== 404,
  });
  const { data } = await response.json<{ data: Data }>();
  return data;
}
