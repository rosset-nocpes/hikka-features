import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type {
  AnimeFandub,
  TeamRelease,
  TeamSummary,
  TranslationType,
} from '@/utils/convex-api';

import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { ProviderTeamIFrame } from '@/utils/provider_classes';

export interface FandubTeam extends Omit<TeamSummary, 'id'> {
  /** Catalog teams' id, else the player's title. */
  key: string;
  releases: TeamRelease[];
}

/**
 * Player teams the catalog doesn't know, which the backend can't file: one
 * release per translation, the newest episode any provider has.
 */
const unknownPlayerTeams = (data: API.WatchData | undefined) => {
  const teams = new Map<string, FandubTeam>();
  for (const entry of Object.values(data ?? {})) {
    if (!(entry instanceof ProviderTeamIFrame)) continue;
    for (const team of entry.getTeams()) {
      if (team.id) continue;
      // The title is a key with a dub/sub suffix; the canonical one is the name.
      const title = team.canonicalTitle || team.title;
      const key = looseKey(title);
      const type: TranslationType = team.translationType ?? 'unknown';
      const episodes = Math.max(
        0,
        ...(entry.teams[team.title]?.episodes ?? []).map((ep) => ep.episode),
      );

      const current = teams.get(key) ?? {
        key,
        title,
        logo: team.logo || undefined,
        releases: [],
      };
      const release = current.releases.find(
        (candidate) => candidate.translationType === type,
      );
      if (release) {
        release.episodes = Math.max(release.episodes ?? 0, episodes);
      } else {
        current.releases.push({
          source: 'player',
          sources: ['player'],
          translationType: type,
          episodes: episodes || undefined,
          updatedAt: 0,
        });
      }
      teams.set(key, current);
    }
  }
  return [...teams.values()];
};

/**
 * What a listed team can be called: its name, without its brackets, or the
 * abbreviation in them ("Glass Moon (GM)" → "GM").
 */
const nameKeys = (title: string) => [
  looseKey(title),
  looseKey(title.replace(/\([^)]*\)|\[[^\]]*\]/gu, '').trim()),
  ...[...title.matchAll(/[([]([^)\]]+)[)\]]/gu)].map(([, inner = '']) =>
    looseKey(inner),
  ),
];

/** A player's releases join the team's where it has none of that kind. */
const addReleases = (team: FandubTeam, releases: TeamRelease[]) => {
  for (const release of releases) {
    const current = team.releases.find(
      (candidate) => candidate.translationType === release.translationType,
    );
    if (!current) {
      team.releases = [...team.releases, release];
    } else if (!current.sources.includes('player')) {
      current.sources = [...current.sources, 'player'];
      current.episodes ??= release.episodes;
    }
  }
};

/**
 * Teams that dubbed or subtitled the page's anime, from the extension's
 * catalog, the Notion catalog and the players, in that order of trust (the
 * backend merges them). Asked again once the player's data is fresh, which
 * also refreshes what the backend knows of the players.
 */
const useFandubTeams = () => {
  const { slug } = usePageStore();
  const watch = useWatchData();

  const catalog = useQuery({
    queryKey: ['fandub', slug, watch.dataUpdatedAt],
    queryFn: (): Promise<AnimeFandub> =>
      convex.query(convexApi.fandub.forAnime, { slug: slug! }),
    enabled: !!slug,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const teams = useMemo(() => {
    const known: FandubTeam[] = (catalog.data?.teams ?? []).map(
      ({ team, releases }) => ({
        key: team.id,
        slug: team.slug,
        title: team.title,
        logo: team.logo,
        // Copies, since the player's releases may join them.
        releases: releases.map((release) => ({ ...release })),
      }),
    );
    const extra: FandubTeam[] = [];
    for (const team of unknownPlayerTeams(watch.data)) {
      const matches = known.filter((candidate) =>
        nameKeys(candidate.title).includes(team.key),
      );
      // Only a name that points at one listed team is that team.
      const [match, ...others] = matches;
      if (match && others.length === 0) addReleases(match, team.releases);
      else extra.push(team);
    }
    return [...known, ...extra];
  }, [catalog.data, watch.data]);

  return {
    teams,
    episodesTotal: catalog.data?.episodesTotal,
    isLoading: catalog.isLoading,
  };
};

export default useFandubTeams;
