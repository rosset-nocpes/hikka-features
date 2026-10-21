import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsSadTabRounded from '~icons/material-symbols/sad-tab-rounded';

import BlockEntry from '@/components/block-entry';
import BlockHeader from '@/components/hikka/block-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import HFxCPRBadgeDark from '@/public/hf-x-cpr-dark.svg';
import HFxCPRBadge from '@/public/hf-x-cpr.svg';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class FandubBlockFeature extends BaseFeature {
  readonly id = 'fandub-block';
  readonly pages = [HikkaPages.AnimeMainPage];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'last',
      anchor: '#content-left-side',
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        syncFeatureTheme(container, { themeVariables: true });

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <FandubBlock />
          </QueryClientProvider>,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
  }
}

const FandubBlock: FC = () => {
  const { enabled } = useSettings().features.fandubBlock;
  const { data, isLoading, isError } = useNotionData();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          className="flex min-w-0 flex-col gap-3"
          initial={{ opacity: 0, height: 0, scale: 0.93 }}
          animate={{ opacity: 1, height: 'auto', scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.93 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <BlockHeader title="Від команд">
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
          </BlockHeader>
          <div className="surface border-border relative isolate flex min-w-0 flex-col gap-4 overflow-clip rounded-lg border p-4">
            <div className="flex flex-col gap-2">
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="skeleton bg-secondary/60 h-10 animate-pulse"
                  />
                ))}
              {(isError || (data && !data.fandub)) && (
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
              {data?.fandub && (
                <Fragment>
                  {data.fandub.length > 4 && (
                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                      <div className="flex flex-col gap-4">
                        {data.fandub.slice(0, 4).map((team) => (
                          <BlockEntry key={team.title} href={team.link}>
                            <Avatar className="w-10 rounded-md">
                              <AvatarImage loading="lazy" src={team.logo} />
                              <AvatarFallback>
                                {team.title[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="line-clamp-1 truncate text-sm leading-tight font-medium">
                              {team.title}
                            </span>
                          </BlockEntry>
                        ))}
                      </div>
                      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
                        <div className="flex flex-col gap-4 pt-4">
                          {data.fandub.slice(4).map((team) => (
                            <BlockEntry key={team.title} href={team.link}>
                              <Avatar className="w-10 rounded-md">
                                <AvatarImage loading="lazy" src={team.logo} />
                                <AvatarFallback>
                                  {team.title[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="line-clamp-1 truncate text-sm leading-tight font-medium">
                                {team.title}
                              </span>
                            </BlockEntry>
                          ))}
                        </div>
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
                  )}
                  {data.fandub.length <= 4 && (
                    <div className="flex flex-col gap-4">
                      {data.fandub.map((team) => (
                        <BlockEntry key={team.title} href={team.link}>
                          <Avatar className="w-10 rounded-md">
                            <AvatarImage loading="lazy" src={team.logo} />
                            <AvatarFallback>
                              {team.title[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="line-clamp-1 truncate text-sm leading-tight font-medium">
                            {team.title}
                          </span>
                        </BlockEntry>
                      ))}
                    </div>
                  )}
                </Fragment>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
