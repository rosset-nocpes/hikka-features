import BlockEntry from '@/components/block-entry';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import useNotionData from '@/hooks/use-notion-data';
import HFxCPRBadge from '@/public/hf-x-cpr.svg';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { FC, Fragment, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsSadTabRounded from '~icons/material-symbols/sad-tab-rounded';
import { queryClient } from '..';

const fandubBlock = async (
  ctx: ContentScriptContext,
  anime_data: any,
  smallerTitle?: boolean,
  location?: Element,
) => {
  if (document.body.querySelectorAll('fandub-block').length !== 0) {
    return;
  }

  return createShadowRootUi(ctx, {
    name: 'fandub-block',
    position: 'inline',
    append: 'last',
    anchor:
      location ||
      document.querySelector(
        'main > div > div.flex.flex-col.gap-4 > div.flex.w-full.flex-col.gap-4 > div',
      )!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <FandubBlock anime_data={anime_data} smallerTitle={smallerTitle} />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

interface Props {
  anime_data: any;
  smallerTitle?: boolean;
}

const FandubBlock: FC<Props> = ({ anime_data, smallerTitle }) => {
  const { data, isLoading, isError } = useNotionData(anime_data.slug);

  const [isOpen, setIsOpen] = useState(false);
  const [blockState, setBlockState] = useState<boolean>();

  useEffect(() => {
    const initializeAsync = async () => {
      setBlockState(await fandubBlockState.getValue());
    };

    initializeAsync();
  }, []);

  fandubBlockState.watch((state) => setBlockState(state));

  //   todo: add animation
  return (
    <AnimatePresence>
      {blockState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <h3
            className={`flex scroll-m-20 items-center justify-between font-unitysans ${
              smallerTitle ? 'text-lg' : 'text-xl'
            } font-bold tracking-normal`}
          >
            Від команд
            <a
              href="https://drbryanman.github.io/CPRcatalog/#/"
              target="_blank"
            >
              <img src={HFxCPRBadge} style={{ height: '20px' }} />
            </a>
          </h3>
          <div className="flex flex-col gap-2">
            {isLoading &&
              Array(3).fill(
                <div className="skeleton h-10 animate-pulse bg-secondary/60" />,
              )}
            {(isError || (data && !data.fandub)) && (
              <BlockEntry className="cursor-default text-muted-foreground">
                <Avatar className="size-8 rounded-sm">
                  <AvatarFallback>
                    <MaterialSymbolsSadTabRounded className="size-6" />
                  </AvatarFallback>
                </Avatar>
                Немає даних
              </BlockEntry>
            )}
            {data && data.fandub && (
              <Fragment>
                {data.fandub.length > 3 && (
                  <Collapsible
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    className="flex flex-col gap-2"
                  >
                    {data.fandub.slice(0, 3).map((team) => (
                      <BlockEntry key={team.title} href={team.link}>
                        <Avatar className="size-8 rounded-sm">
                          <AvatarImage
                            loading="lazy"
                            src={
                              STUDIO_LOGOS[
                                STUDIO_CORRECTED_NAMES[team.title]
                                  ? STUDIO_CORRECTED_NAMES[team.title]
                                      .replaceAll(' ', '')
                                      .toLowerCase()
                                  : team.title.replaceAll(' ', '').toLowerCase()
                              ]
                            }
                          />
                          <AvatarFallback>
                            {team.title[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {STUDIO_CORRECTED_NAMES[team.title] || team.title}
                      </BlockEntry>
                    ))}
                    <CollapsibleContent
                      asChild
                      className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
                    >
                      <div className="flex flex-col gap-2">
                        {data.fandub.slice(3).map((team) => (
                          <BlockEntry key={team.title} href={team.link}>
                            <Avatar className="size-8 rounded-sm">
                              <AvatarImage
                                loading="lazy"
                                src={
                                  STUDIO_LOGOS[
                                    STUDIO_CORRECTED_NAMES[team.title]
                                      ? STUDIO_CORRECTED_NAMES[team.title]
                                          .replaceAll(' ', '')
                                          .toLowerCase()
                                      : team.title
                                          .replaceAll(' ', '')
                                          .toLowerCase()
                                  ]
                                }
                              />
                              <AvatarFallback>
                                {team.title[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {STUDIO_CORRECTED_NAMES[team.title] || team.title}
                          </BlockEntry>
                        ))}
                      </div>
                    </CollapsibleContent>
                    <div className="footer">
                      <CollapsibleTrigger asChild>
                        <Button variant="link" size="sm" className="p-0">
                          {isOpen ? 'Згорнути...' : 'Показати більше...'}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </Collapsible>
                )}
                {data.fandub.length <= 3 &&
                  data.fandub.map((team) => (
                    <BlockEntry href={team.link}>
                      <Avatar className="size-8 rounded-sm">
                        <AvatarImage
                          loading="lazy"
                          src={
                            STUDIO_LOGOS[
                              STUDIO_CORRECTED_NAMES[team.title]
                                ? STUDIO_CORRECTED_NAMES[team.title]
                                    .replaceAll(' ', '')
                                    .toLowerCase()
                                : team.title.replaceAll(' ', '').toLowerCase()
                            ]
                          }
                        />
                        <AvatarFallback>
                          {team.title[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {STUDIO_CORRECTED_NAMES[team.title] || team.title}
                    </BlockEntry>
                  ))}
              </Fragment>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default fandubBlock;
