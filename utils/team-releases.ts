import type {
  ReleaseStatus,
  TeamRelease,
  TranslationType,
} from '@/utils/convex-api';

export const TRANSLATION_LABELS: Record<TranslationType, string> = {
  dub: 'Озвучення',
  sub: 'Субтитри',
  unknown: 'Реліз',
};

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  announced: 'Анонс',
  ongoing: 'Виходить',
  finished: 'Завершено',
  paused: 'Призупинено',
  dropped: 'Закинуто',
};

/** hikka.io's names for its media types. */
export const MEDIA_TYPE_LABELS: Record<string, string> = {
  tv: 'TV Серіал',
  movie: 'Фільм',
  ona: 'ONA',
  ova: 'OVA',
  special: 'Спешл',
  music: 'Музика',
};

/**
 * How far a release is: "5 / 12", "5 еп." past a known total, or its
 * status when it gives no count. Nothing for single-episode titles, whose
 * release says it all.
 */
export function releaseProgress(
  release: Pick<TeamRelease, 'episodes' | 'episodesTotal' | 'status'>,
  animeEpisodesTotal?: number,
) {
  const total = release.episodesTotal ?? animeEpisodesTotal;
  const status = release.status && RELEASE_STATUS_LABELS[release.status];
  if (total === 1) return status;
  if (release.episodes === undefined) return status;
  return total && release.episodes <= total
    ? `${release.episodes} / ${total}`
    : `${release.episodes} еп.`;
}

/** "Озвучення 5 / 12 · Субтитри 12 / 12". */
export const describeReleases = (
  releases: TeamRelease[],
  animeEpisodesTotal?: number,
) =>
  releases
    .map((release) =>
      [
        TRANSLATION_LABELS[release.translationType],
        releaseProgress(release, animeEpisodesTotal),
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' · ');
