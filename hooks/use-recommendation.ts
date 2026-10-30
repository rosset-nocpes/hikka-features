import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

import type { ContentCardItem } from '@/components/hikka/content-card';

import type { ContentType } from './use-page-store';

import { fetchHikka, HIKKA_API } from './use-hikka';

/**
 * What the recommendations page and its tab are called. hikka.io's tabs
 * just fit a title's header; a longer name would push "Обговорення" out.
 */
export const RECOMMENDATIONS_TAB = 'Схожі';

/** A title users recommend with the page's, as its Hikka entry. */
export type Recommendation = ContentCardItem & { mal_id: number };

/** A source's recommendations: MAL ids, and how many users back each. */
type Votes = Map<number, number>;

/** Two MAL ids of the same story, as a sequel and its prequel. */
type Link = [number, number];

/** A site whose users recommend titles with the page's. */
interface Source {
  name: string;
  /** Where the site lists them. */
  url: string;
  votes: Votes;
  /** Ties of the recommended titles to others, if the site tells them. */
  links: Link[];
}

/** MAL, and AniList with it, keep novels with manga. */
const malType = (contentType: ContentType) =>
  contentType === 'novel' ? 'manga' : contentType;

/** MAL's recommendations, each written by a user, from tenrai's MAL mirror. */
const fetchMal = async (
  contentType: ContentType,
  malId: number,
): Promise<Source> => {
  const type = malType(contentType);
  const { data } = await ky
    .get(`https://api.tenrai.org/v1/${type}/${malId}/recommendations`)
    .json<{ data: Array<{ entry: { mal_id: number }; votes: number }> }>();
  return {
    name: 'MyAnimeList',
    url: `https://myanimelist.net/${type}/${malId}/_/userrecs`,
    votes: new Map(data.map(({ entry, votes }) => [entry.mal_id, votes])),
    links: [],
  };
};

/**
 * AniList's best 50, in one request: it gives 25 at a time. With each comes
 * what it relates to, for its other seasons and versions.
 */
const ANILIST_QUERY = `
  fragment votes on RecommendationConnection {
    nodes {
      rating
      mediaRecommendation {
        idMal
        relations {
          edges {
            relationType
            node {
              idMal
              type
            }
          }
        }
      }
    }
  }
  query ($malId: Int, $type: MediaType) {
    Media(idMal: $malId, type: $type) {
      siteUrl
      first: recommendations(sort: [RATING_DESC, ID], page: 1, perPage: 25) {
        ...votes
      }
      second: recommendations(sort: [RATING_DESC, ID], page: 2, perPage: 25) {
        ...votes
      }
    }
  }
`;

type AniListVotes = {
  nodes: Array<{
    rating: number;
    mediaRecommendation: {
      idMal: number | null;
      relations: {
        edges: Array<{
          relationType: string;
          node: { idMal: number | null; type: string };
        }>;
      };
    } | null;
  }>;
};

/**
 * AniList's relations within a story: all but crossovers (`CHARACTER`) and
 * loose ties (`OTHER`).
 */
const SAME_STORY = new Set([
  'SEQUEL',
  'PREQUEL',
  'PARENT',
  'SIDE_STORY',
  'SPIN_OFF',
  'ALTERNATIVE',
  'SUMMARY',
  'COMPILATION',
  'CONTAINS',
  'ADAPTATION',
  'SOURCE',
]);

/**
 * AniList's recommendations, which its users rate up or down, less those
 * rated down as much as up, or with no MAL entry to find on Hikka by.
 */
const fetchAniList = async (
  contentType: ContentType,
  malId: number,
): Promise<Source> => {
  const type = malType(contentType).toUpperCase();
  const { data } = await ky
    .post('https://graphql.anilist.co', {
      json: { query: ANILIST_QUERY, variables: { malId, type } },
    })
    .json<{
      data: {
        Media: {
          siteUrl: string;
          first: AniListVotes;
          second: AniListVotes;
        } | null;
      };
    }>();
  const votes: Votes = new Map();
  const links: Link[] = [];
  for (const { rating, mediaRecommendation } of [
    ...(data.Media?.first.nodes ?? []),
    ...(data.Media?.second.nodes ?? []),
  ]) {
    const id = mediaRecommendation?.idMal;
    if (!id || rating <= 0) continue;
    votes.set(id, rating);
    for (const { relationType, node } of mediaRecommendation.relations.edges) {
      // MAL numbers anime and manga apart, so an adaptation's id is another's.
      if (node.idMal && node.type === type && SAME_STORY.has(relationType)) {
        links.push([id, node.idMal]);
      }
    }
  }
  return { name: 'AniList', url: data.Media?.siteUrl ?? '', votes, links };
};

/**
 * Votes a source's total must reach to count fully: with fewer, its few
 * votes don't outweigh another's many.
 */
const PRIOR_VOTES = 20;

/**
 * Each story's MAL ids, best first, the stories by the votes for all their
 * titles. A title's votes are each source's share of them: AniList users
 * upvote in a click where MAL users write, so AniList's counts run 10 to 40
 * times higher, and only shares of each source's total compare. Seasons and
 * versions of a story are told apart only through AniList, so MAL's alone
 * stay apart.
 */
const rank = (sources: Source[]) => {
  const scores = new Map<number, number>();
  for (const { votes } of sources) {
    let total = PRIOR_VOTES;
    for (const count of votes.values()) total += count;
    for (const [id, count] of votes) {
      scores.set(id, (scores.get(id) ?? 0) + count / total);
    }
  }

  // Titles tied through others are of one story too, as a first and a
  // third season through the second.
  const parent = new Map<number, number>();
  const story = (id: number): number => {
    const up = parent.get(id);
    if (up === undefined || up === id) return id;
    const root = story(up);
    parent.set(id, root);
    return root;
  };
  for (const { links } of sources) {
    for (const [a, b] of links) parent.set(story(a), story(b));
  }

  const stories = new Map<number, { ids: number[]; score: number }>();
  for (const [id, score] of [...scores].sort(([, a], [, b]) => b - a)) {
    const root = story(id);
    const entry = stories.get(root) ?? { ids: [], score: 0 };
    entry.ids.push(id);
    entry.score += score;
    stories.set(root, entry);
  }
  return [...stories.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ ids }) => ids);
};

/** The slugs of a title's franchise: its other seasons, adaptations, spin-offs. */
const fetchFranchise = async (contentType: ContentType, slug: string) => {
  const franchise = await fetchHikka<
    Partial<Record<ContentType, Array<{ slug: string }>>>
  >(`related/${contentType}/${slug}/franchise`);
  return new Set(
    (['anime', 'manga', 'novel'] as const).flatMap(
      (type) => franchise[type]?.map((entry) => entry.slug) ?? [],
    ),
  );
};

/** Where Hikka may have filed a MAL entry, the page's own type first. */
const HIKKA_TYPES: Partial<Record<ContentType, ContentType[]>> = {
  anime: ['anime'],
  manga: ['manga', 'novel'],
  novel: ['novel', 'manga'],
};

/** How many MAL ids Hikka looks up at once. */
const MAX_IDS = 500;

/** Hikka's entries for MAL ids, by them, less those it doesn't have. */
const findOnHikka = async (contentType: ContentType, malIds: number[]) => {
  const found = new Map<number, Recommendation>();
  for (const type of HIKKA_TYPES[contentType] ?? []) {
    const missing = malIds.filter((id) => !found.has(id));
    if (missing.length === 0) break;
    const entries = await ky
      .post(`${HIKKA_API}/integrations/mal/${type}`, {
        json: { mal_ids: missing },
      })
      .json<(Recommendation | null)[]>();
    for (const entry of entries) {
      if (entry) found.set(entry.mal_id, entry);
    }
  }
  return found;
};

/**
 * The titles MAL and AniList users recommend with the page's, best first, as
 * Hikka entries: the best one of each story, less the page's own franchise,
 * which AniList users sometimes recommend with a sequel. The sites they come
 * from are credited. The block and the page share them.
 */
const useRecommendation = () => {
  const { contentType, slug } = usePageStore();
  const { data } = useHikka();
  const malId: number | undefined = data?.mal_id;

  return useQuery({
    queryKey: ['recommendations', contentType, slug],
    queryFn: async () => {
      const type = contentType!;
      const [franchise, ...results] = await Promise.allSettled([
        fetchFranchise(type, slug!),
        fetchMal(type, malId!),
        fetchAniList(type, malId!),
      ]);
      // Kept for good once fetched, so not when no site answered.
      if (results.every((result) => result.status === 'rejected')) {
        throw new Error('No recommendation source answered');
      }
      const sources = results.flatMap((result) =>
        result.status === 'fulfilled' && result.value.votes.size > 0
          ? [result.value]
          : [],
      );
      const stories = rank(sources);
      const own =
        franchise.status === 'fulfilled' ? franchise.value : new Set<string>();
      const found = await findOnHikka(type, stories.flat().slice(0, MAX_IDS));
      return {
        list: stories.flatMap((ids) => {
          const entry = ids
            .map((id) => found.get(id))
            .find((entry) => entry && !own.has(entry.slug));
          return entry ? [entry] : [];
        }),
        sources: sources.map(({ name, url }) => ({ name, url })),
      };
    },
    enabled: !!contentType && !!slug && !!malId,
    retry: false,
    staleTime: Infinity,
  });
};

export default useRecommendation;
