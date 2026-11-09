import type { ReactNode } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsCheckRounded from '~icons/material-symbols/check-rounded';
import MaterialSymbolsContentCopyOutlineRounded from '~icons/material-symbols/content-copy-outline-rounded';
import MaterialSymbolsDataObjectRounded from '~icons/material-symbols/data-object-rounded';
import MaterialSymbolsOpenInNewRounded from '~icons/material-symbols/open-in-new-rounded';

import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/hooks/use-copy';
import {
  fetchHikka,
  HIKKA_API,
  type HikkaContent,
  hikkaApiPath,
} from '@/hooks/use-hikka';
import { reveal } from '@/utils/motion';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

const title = () => document.querySelector('main h1');

/** The block each page's bar goes after, in a column with a gap. */
const titleBlock = (): Element | null | undefined => {
  switch (usePageStore.getState().path?.[0]) {
    case 'anime':
    case 'manga':
    case 'novel':
      return document.querySelector('#content-hero')?.lastElementChild;
    case 'characters':
    case 'people':
      return title()?.closest('div.justify-between');
    case 'edit':
      return title()?.closest('div.min-h-8');
    case 'u':
      return title()?.closest('div.md\\:flex-row');
  }
};

export default class DevButtonsFeature extends BaseFeature {
  readonly id = 'dev-buttons';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
    HikkaPages.CharacterPage,
    HikkaPages.PersonPage,
    HikkaPages.EditPage,
    HikkaPages.UserPage,
  ];

  async init() {
    let gap = '0px';
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      anchor: titleBlock,
      append: 'after',
      // The column's gap goes to the bar, so nothing's left while it's off.
      onMount: (_container, _wrapper, host) => {
        const rowGap = getComputedStyle(host.parentElement!).rowGap;
        gap = rowGap === 'normal' ? '0px' : rowGap;
        host.style.display = 'block';
        host.style.marginTop = `calc(-1 * ${gap})`;
      },
      render: () => <DevButtons gap={gap} />,
    });
  }
}

interface Copy {
  key: string;
  label: ReactNode;
  text?: string | null;
  icon?: ReactNode;
}

interface Link {
  label: string;
  href: string;
}

const json = (data: unknown): Copy => ({
  key: 'json',
  label: 'JSON',
  icon: <MaterialSymbolsDataObjectRounded className="size-4" />,
  text: JSON.stringify(data, null, 2),
});

const apiLink = (path: string): Link => ({
  label: 'API',
  href: `${HIKKA_API}/${path}`,
});

/** What a page of content (an anime, a character, an edit…) offers. */
const contentTools = (
  section: string,
  data: HikkaContent,
): { copies: Copy[]; links: Link[] } => {
  if (section === 'edit') {
    const content = data.content;
    const type = data.content_type;
    return {
      copies: [
        { key: 'id', label: `#${data.edit_id}`, text: String(data.edit_id) },
        { key: 'slug', label: content?.slug, text: content?.slug },
        json(data),
      ],
      links: [
        apiLink(`edit/${data.edit_id}`),
        ...(type && content?.slug
          ? [
              {
                label: 'API контенту',
                href: `${HIKKA_API}/${hikkaApiPath(type)}/${content.slug}`,
              },
            ]
          : []),
      ],
    };
  }

  return {
    copies: [
      { key: 'slug', label: data.slug, text: data.slug },
      { key: 'mal', label: data.mal_id, text: data.mal_id?.toString() },
      json(data),
    ],
    links: [apiLink(`${hikkaApiPath(section)}/${data.slug}`)],
  };
};

interface HikkaUser {
  reference: string;
  username: string;
}

/** A profile's username and Hikka id, which the backend keys users by. */
const useUserTools = (username?: string) => {
  const { data } = useQuery({
    queryKey: ['hikka-user', username],
    queryFn: () => fetchHikka<HikkaUser>(`user/${username}`),
    enabled: !!username,
    retry: false,
    staleTime: Infinity,
  });
  if (!data) return;
  return {
    copies: [
      { key: 'username', label: data.username, text: data.username },
      { key: 'reference', label: data.reference, text: data.reference },
      json(data),
    ],
    links: [apiLink(`user/${data.username}`)],
  };
};

/**
 * Tools for working on the extension: copies of the page's ids and API
 * data, and links to where it comes from.
 */
const DevButtons = ({ gap }: { gap: string }) => {
  const { devTools } = useSettings().features.devOptions;
  const { copied, copy } = useCopy(1000);
  const { path } = usePageStore();
  const section = path?.[0];
  const content = useHikka().data;
  const user = useUserTools(section === 'u' ? path?.[1] : undefined);

  const tools =
    section === 'u'
      ? user
      : content && section && contentTools(section, content);

  return (
    <AnimatePresence>
      {devTools && tools && (
        <motion.div
          className="flex flex-wrap gap-2"
          {...reveal('height', { marginTop: gap })}
        >
          {tools.copies.map(
            ({ key, label, text, icon }) =>
              text && (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className="max-w-full gap-2 overflow-hidden"
                  onClick={() => copy(text, key)}
                >
                  <SwapIcon
                    active={copied === key}
                    on={<MaterialSymbolsCheckRounded className="size-4" />}
                    off={
                      icon ?? (
                        <MaterialSymbolsContentCopyOutlineRounded className="size-4" />
                      )
                    }
                  />
                  <span className="truncate">{label}</span>
                </Button>
              ),
          )}
          {tools.links.map(({ label, href }) => (
            <Button
              key={label}
              variant="ghost"
              size="sm"
              className="gap-2"
              render={
                <a href={href} target="_blank" rel="noopener noreferrer" />
              }
            >
              <MaterialSymbolsOpenInNewRounded className="size-4" />
              {label}
            </Button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
