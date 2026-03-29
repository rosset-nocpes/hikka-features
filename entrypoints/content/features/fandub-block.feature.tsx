import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsSadTabRounded from '~icons/material-symbols/sad-tab-rounded';

import BlockEntry from '@/components/block-entry';
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
      anchor: '.grid.grid-cols-1 > div:nth-of-type(1) > div:nth-of-type(2)',
      inheritStyles: true,
      css: `:host(${this.id}) { ${getThemeVariables()} }`,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

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
          className="overflow-hidden rounded-lg border border-border bg-secondary/20"
          initial={{ opacity: 0, height: 0, scale: 0.93 }}
          animate={{ opacity: 1, height: 'auto', scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.93 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-6 p-4">
            <h4 className="flex items-center justify-between">
              Від команд
              <a
                href="https://drbryanman.github.io/CPRcatalog/#/"
                target="_blank"
                rel="noopener"
              >
                <img
                  src={
                    document.documentElement.classList.contains('dark')
                      ? HFxCPRBadge
                      : HFxCPRBadgeDark
                  }
                  style={{ height: '20px' }}
                />
              </a>
            </h4>
            <div className="flex flex-col gap-2">
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="skeleton h-10 animate-pulse bg-secondary/60"
                  />
                ))}
              {(isError || (data && !data.fandub)) && (
                <BlockEntry className="cursor-default text-muted-foreground">
                  <Avatar className="w-10 rounded-md">
                    <AvatarFallback>
                      <MaterialSymbolsSadTabRounded className="size-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium leading-tight">
                    Немає даних
                  </span>
                </BlockEntry>
              )}
              {data?.fandub && (
                <Fragment>
                  {data.fandub.length > 4 && (
                    <Collapsible
                      open={isOpen}
                      onOpenChange={setIsOpen}
                      className="flex flex-col gap-4"
                    >
                      {data.fandub.slice(0, 4).map((team) => (
                        <BlockEntry key={team.title} href={team.link}>
                          <Avatar className="w-10 rounded-md">
                            <AvatarImage loading="lazy" src={team.logo} />
                            <AvatarFallback>
                              {team.title[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="line-clamp-1 truncate text-sm font-medium leading-tight">
                            {team.title}
                          </span>
                        </BlockEntry>
                      ))}
                      <CollapsibleContent
                        asChild
                        className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
                      >
                        <div className="flex flex-col gap-4">
                          {data.fandub.slice(4).map((team) => (
                            <BlockEntry key={team.title} href={team.link}>
                              <Avatar className="w-10 rounded-md">
                                <AvatarImage loading="lazy" src={team.logo} />
                                <AvatarFallback>
                                  {team.title[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="line-clamp-1 truncate text-sm font-medium leading-tight">
                                {team.title}
                              </span>
                            </BlockEntry>
                          ))}
                        </div>
                      </CollapsibleContent>
                      <div className="footer">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-muted-foreground"
                          >
                            {isOpen ? 'Згорнути...' : 'Показати більше...'}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
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
                          <span className="line-clamp-1 truncate text-sm font-medium leading-tight">
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
