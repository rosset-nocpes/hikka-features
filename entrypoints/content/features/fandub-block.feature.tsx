import { AnimatePresence } from 'motion/react';
import { useState } from 'react';
import MaterialSymbolsSadTabRounded from '~icons/material-symbols/sad-tab-rounded';

import BlockEntry from '@/components/block-entry';
import FeatureCard from '@/components/feature-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

const TeamList = ({
  teams,
  className,
}: {
  teams: API.FandubTeam[];
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-4', className)}>
    {teams.map((team) => (
      <BlockEntry key={team.title} href={team.link}>
        <Avatar className="w-10 rounded-md">
          <AvatarImage loading="lazy" src={team.logo} />
          <AvatarFallback>{team.title[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="line-clamp-1 truncate text-sm leading-tight font-medium">
          {team.title}
        </span>
      </BlockEntry>
    ))}
  </div>
);

const FandubBlock = () => {
  const { enabled } = useSettings().features.fandubBlock;
  const { data, isLoading, isError } = useNotionData();
  const [isOpen, setIsOpen] = useState(false);
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
                src={isHikkaDarkMode() ? HFxCPRBadge : HFxCPRBadgeDark}
                style={{ height: '20px' }}
              />
            </a>
          }
        >
          <div className="flex flex-col gap-2">
            {isLoading &&
              Array.from({ length: SHOWN_TEAMS }, (_, i) => (
                <div
                  key={i}
                  className="skeleton bg-secondary/60 h-10 animate-pulse"
                />
              ))}
            {(isError || (data && !teams)) && (
              <BlockEntry className="text-muted-foreground cursor-default">
                <Avatar className="w-10 rounded-md">
                  <AvatarFallback>
                    <MaterialSymbolsSadTabRounded className="size-6" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm leading-tight font-medium">
                  Немає даних
                </span>
              </BlockEntry>
            )}
            {teams &&
              (teams.length > SHOWN_TEAMS ? (
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <TeamList teams={teams.slice(0, SHOWN_TEAMS)} />
                  <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
                    <TeamList
                      teams={teams.slice(SHOWN_TEAMS)}
                      className="pt-4"
                    />
                  </CollapsibleContent>
                  <CollapsibleTrigger
                    render={
                      <Button
                        variant="link"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-auto p-0 pt-2 text-sm font-medium"
                      >
                        {isOpen ? 'Згорнути...' : 'Показати більше...'}
                      </Button>
                    }
                  />
                </Collapsible>
              ) : (
                <TeamList teams={teams} />
              ))}
          </div>
        </FeatureCard>
      )}
    </AnimatePresence>
  );
};
