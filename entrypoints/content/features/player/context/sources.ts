import { hikkaTracker } from '@/utils/hikka-tracker';
import { ProviderIFrame, ProviderTeamIFrame } from '@/utils/providers';

import type { QueueItem } from '../queue/use-queue';

import { pickPriorityTeam, providersOf } from '../teams';

/** The team of providers that don't split playback by team. */
const NO_TEAM: API.TeamData = { title: '', logo: '' };

export const teamOf = (data: API.WatchData, provider: string, team: string) => {
  const source = data[provider];
  return source instanceof ProviderTeamIFrame ? source.getTeam(team) : NO_TEAM;
};

/** A provider's first team; providers without teams have none. */
const firstTeam = (data: API.WatchData, provider: string) => {
  const source = data[provider];
  return source instanceof ProviderTeamIFrame ? source.getTeams()[0]! : NO_TEAM;
};

/** A provider's episodes by `team`; providers without teams ignore it. */
export const episodesOf = (
  data: API.WatchData,
  provider: string,
  team: string,
) => {
  const source = data[provider];
  if (source instanceof ProviderTeamIFrame) return source.teams[team]?.episodes;
  if (source instanceof ProviderIFrame) return source.episodes;
  return undefined;
};

/** Whether the page is `slug`'s, whose tracker the player may read and use. */
export const onAnimePage = (slug?: string) => {
  const page = usePageStore.getState();
  return !!slug && page.contentType === 'anime' && page.slug === slug;
};

/** Episodes of `slug` the user watched, known on its own page only. */
export const progressOf = (slug?: string) =>
  onAnimePage(slug) ? hikkaTracker.progress : 0;

/** The episode after the user's progress on hikka.io, else the first. */
export const nextUnwatched = (episodes: API.EpisodeData[], slug?: string) =>
  episodes.find((episode) => episode.episode === progressOf(slug) + 1) ??
  episodes[0];

/** The user's team priority's pick for `episode` among `providers`. */
const priorityPick = (
  data: API.WatchData,
  providers: string[],
  episode: number,
) => {
  const { teamPriority, teamPriorityTranslation } =
    useSettings.getState().features.player;
  return pickPriorityTeam(
    data,
    providers,
    teamPriority,
    teamPriorityTranslation,
    episode,
  );
};

/** The team the user's priority picks on `provider`, else its first one. */
export const priorityTeam = (
  data: API.WatchData,
  provider: string,
  slug?: string,
) =>
  priorityPick(data, [provider], progressOf(slug) + 1)?.team ??
  firstTeam(data, provider);

/** `slug`'s favourite team, if its provider still lists it. */
export const favoriteIn = (data: API.WatchData, slug: string) => {
  const stored = useSettings.getState().features.player.favoriteTeams[slug];
  const source = stored && data[stored.provider];
  const team =
    source instanceof ProviderTeamIFrame
      ? source
          .getTeams()
          .find(
            (candidate) =>
              candidate.title === stored!.team ||
              candidate.canonicalTitle === stored!.team,
          )
      : undefined;
  return {
    team: team && { provider: stored!.provider, team },
    favoriteTeam: team
      ? { provider: stored!.provider, team: team.title }
      : stored,
  };
};

/** The watch data's providers, the user's default one first. */
export const providerOrder = (data: API.WatchData) => {
  const { defaultProvider } = useSettings.getState().features.player;
  const available = providersOf(data).map(({ title }) => title);
  return available.includes(defaultProvider)
    ? [defaultProvider, ...available.filter((name) => name !== defaultProvider)]
    : available;
};

/**
 * The source the player opens `slug` with: this anime's favourite team, then
 * the team priority list, then the default provider's first team.
 */
export const preferredSource = (data: API.WatchData, slug: string) => {
  const providers = providerOrder(data);
  const provider = providers[0]!;
  return (
    favoriteIn(data, slug).team ??
    priorityPick(data, providers, progressOf(slug) + 1) ?? {
      provider,
      team: firstTeam(data, provider),
    }
  );
};

/**
 * Where a share link's `provider` and `team` play, falling back to the
 * preferred source when the provider is gone, and to the preferred or first
 * team when the team is.
 */
export const sharedSource = (
  data: API.WatchData,
  slug: string,
  provider: string,
  team: string,
) => {
  const preferred = preferredSource(data, slug);
  const source = data[provider];
  if (!providersOf(data).some(({ title }) => title === provider)) {
    return preferred;
  }
  return {
    provider,
    team: !(source instanceof ProviderTeamIFrame)
      ? NO_TEAM
      : source.teams[team]
        ? source.getTeam(team)
        : preferred.provider === provider
          ? preferred.team
          : source.getTeams()[0]!,
  };
};

/**
 * Where a queued episode plays: the source it was queued from, else the team
 * priority's pick, else any source that has it.
 */
export const queuedSource = (data: API.WatchData, target: QueueItem) => {
  const providers = providersOf(data).map(({ title }) => title);
  const pick = priorityPick(data, providers, target.episode);
  const candidates = [
    target,
    ...(pick ? [{ provider: pick.provider, team: pick.team.title }] : []),
    ...providers.flatMap((provider) => {
      const source = data[provider];
      return source instanceof ProviderTeamIFrame
        ? Object.keys(source.teams).map((team) => ({ provider, team }))
        : [{ provider, team: '' }];
    }),
  ];

  for (const { provider, team } of candidates) {
    const episodeData = episodesOf(data, provider, team);
    const currentEpisode = episodeData?.find(
      (episode) => episode.episode === target.episode,
    );
    if (currentEpisode) {
      return {
        provider,
        team: teamOf(data, provider, team),
        episodeData: episodeData!,
        currentEpisode,
      };
    }
  }
  return undefined;
};

const episodeKey = (episode: API.EpisodeData) => [
  episode.episode,
  episode.video_url,
];

/** Changes only when the watch data's sources or episodes do. */
export const watchDataKey = (data: API.WatchData) =>
  JSON.stringify([
    data.type,
    ...Object.entries(data)
      .filter(([key]) => key !== 'type')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([provider, entry]) => {
        if (entry instanceof ProviderTeamIFrame) {
          return [
            provider,
            entry.type,
            entry.lang,
            Object.entries(entry.teams)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([team, teamData]) => [
                team,
                teamData.logo,
                teamData.episodes.map(episodeKey),
              ]),
          ];
        }

        if (entry instanceof ProviderIFrame) {
          return [
            provider,
            entry.type,
            entry.lang,
            entry.episodes.map(episodeKey),
          ];
        }

        return [provider, entry];
      }),
  ]);
