import ky from 'ky';

/**
 * Runs a query on AniList's GraphQL API and gives its `data`. A title AniList
 * lacks comes back as a 404 that still carries `data` (with it `null`).
 */
export async function queryAniList<Data>(
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await ky.post('https://graphql.anilist.co', {
    json: { query, variables },
    throwHttpErrors: (status) => status !== 404,
  });
  const { data } = await response.json<{ data: Data }>();
  return data;
}
