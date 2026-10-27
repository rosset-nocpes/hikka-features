import { AnimatePresence } from 'motion/react';
import MaterialSymbolsRecordVoiceOverOutlineRounded from '~icons/material-symbols/record-voice-over-outline-rounded';

import FeatureCard from '@/components/feature-card';
import LinkRow from '@/components/hikka/link-row';
import ShowMoreList from '@/components/hikka/show-more-list';
import TeamLogo from '@/components/hikka/team-logo';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import HFxCPRBadgeDark from '@/public/hf-x-cpr-dark.svg';
import HFxCPRBadge from '@/public/hf-x-cpr.svg';
import { teamPagePath } from '@/utils/hikka-router';
import { describeReleases } from '@/utils/team-releases';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/** Teams shown before "show more". */
const SHOWN_TEAMS = 4;

export default class FandubBlockFeature extends BaseFeature {
  readonly id = 'fandub-block';
  readonly pages = [HikkaPages.AnimeMainPage];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'last',
      anchor: '#content-left-side',
      render: () => <FandubBlock />,
    });
  }
}

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-2">
    <Skeleton className="size-10 shrink-0" />
    <div className="flex flex-1 flex-col gap-1.5">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  </div>
);

/**
 * Teams that dubbed or subtitled the anime, from the extension's catalog,
 * the CPR catalog and the player, each linking to its page.
 */
const FandubBlock = () => {
  const { enabled } = useSettings().features.fandubBlock;
  const { slug } = usePageStore();
  const { data: anime } = useHikkaContent('anime', slug);
  const { teams, episodesTotal, isLoading } = useFandubTeams();
  const total = episodesTotal ?? anime?.episodes_total ?? undefined;

  return (
    <AnimatePresence>
      {enabled && (
        <FeatureCard
          title="Від команд"
          to={teamPagePath()}
          badge={
            <a
              href="https://drbryanman.github.io/CPRcatalog/#/"
              target="_blank"
              rel="noopener"
            >
              <img
                src={hikkaTheme.isDark ? HFxCPRBadge : HFxCPRBadgeDark}
                style={{ height: '20px' }}
              />
            </a>
          }
        >
          {isLoading ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: SHOWN_TEAMS }, (_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : teams.length ? (
            <ShowMoreList shown={SHOWN_TEAMS}>
              {teams.map((team) => (
                <LinkRow
                  key={team.key}
                  to={team.slug && teamPagePath(team.slug)}
                  label={team.title}
                  description={describeReleases(team.releases, total)}
                  icon={
                    // Logos are avatars, so they fill the tile.
                    <TeamLogo
                      title={team.title}
                      logo={team.logo}
                      className="size-full rounded-none after:hidden"
                    />
                  }
                />
              ))}
            </ShowMoreList>
          ) : (
            <EmptyState
              size="sm"
              icon={<MaterialSymbolsRecordVoiceOverOutlineRounded />}
              title="Немає даних"
            />
          )}
        </FeatureCard>
      )}
    </AnimatePresence>
  );
};
