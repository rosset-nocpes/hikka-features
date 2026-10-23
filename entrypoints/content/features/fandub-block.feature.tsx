import { AnimatePresence } from 'motion/react';
import MaterialSymbolsRecordVoiceOverOutlineRounded from '~icons/material-symbols/record-voice-over-outline-rounded';

import FeatureCard from '@/components/feature-card';
import LinkRow from '@/components/hikka/link-row';
import ShowMoreList from '@/components/hikka/show-more-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import HFxCPRBadgeDark from '@/public/hf-x-cpr-dark.svg';
import HFxCPRBadge from '@/public/hf-x-cpr.svg';

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
    <Skeleton className="h-4 w-1/2" />
  </div>
);

const FandubBlock = () => {
  const { enabled } = useSettings().features.fandubBlock;
  const { data, isLoading } = useNotionData();
  const teams = data?.fandub;

  return (
    <AnimatePresence>
      {enabled && (
        <FeatureCard
          title="Від команд"
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
          ) : teams?.length ? (
            <ShowMoreList shown={SHOWN_TEAMS}>
              {teams.map((team) => (
                <LinkRow
                  key={team.link}
                  href={team.link}
                  label={team.title}
                  icon={
                    // Logos are avatars, so they fill the tile.
                    <Avatar className="size-full rounded-none after:hidden">
                      <AvatarImage loading="lazy" src={team.logo} />
                      <AvatarFallback className="text-muted-foreground bg-transparent font-medium">
                        {team.title[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
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
