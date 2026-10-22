import { Check, ClipboardCopy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/hooks/use-copy';
import { reveal } from '@/utils/motion';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class DevButtonsFeature extends BaseFeature {
  readonly id = 'dev-buttons';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
  ];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'last',
      anchor: '#content-hero',
      hostCss: 'margin-bottom: -1rem !important;',
      render: () => <DevButtons />,
    });
  }
}

/** The page's slug and MAL id, copied with a click. */
const DevButtons = () => {
  const { devTools } = useSettings().features.devOptions;
  const { copied, copy } = useCopy(1000);
  const { data } = useHikka();

  if (!data) return;

  return (
    <AnimatePresence>
      {devTools && (
        <motion.div
          className="flex gap-2"
          {...reveal('height', { marginBottom: '1rem' })}
        >
          {[data.slug, data.mal_id].filter(Boolean).map((value) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              className="gap-2 overflow-hidden"
              onClick={() => copy(String(value))}
            >
              <SwapIcon
                active={copied === String(value)}
                on={<Check className="size-4" />}
                off={<ClipboardCopy className="size-4" />}
              />
              <span className="truncate">{value}</span>
            </Button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
