import { QueryClientProvider } from '@tanstack/react-query';
import { Check, ClipboardCopy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class DevButtonsFeature extends BaseFeature {
  readonly id = 'dev-buttons';
  readonly pages = [
    HikkaPages.AnimeMainPage,
    HikkaPages.MangaMainPage,
    HikkaPages.NovelMainPage,
  ];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      append: 'last',
      anchor: '.grid.grid-cols-1 > div:nth-of-type(2) > div:nth-of-type(1)',
      css: `:host(${this.id}) { margin-bottom: -1rem !important; }`,
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        container.style = getThemeVariables();
        container.classList.toggle(
          'dark',
          getComputedStyle(document.documentElement).colorScheme === 'dark',
        );

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <DevButtons />
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

const DevButtons = () => {
  const { devTools } = useSettings().features.devOptions;
  const [copiedButton, setCopiedButton] = useState<string | null>(null);

  const data = useHikka()?.data;
  if (!data) return;

  const handleCopy = async (text: string, buttonId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedButton(buttonId);
    setTimeout(() => {
      setCopiedButton(null);
    }, 1000);
  };

  const slug = data.slug;
  const mal_id = data.mal_id;

  return (
    <AnimatePresence>
      {devTools && (
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            scale: 1,
            marginBottom: '1rem',
          }}
          exit={{ opacity: 0, height: 0, scale: 0.93, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="overflow-hidden"
            onClick={() => handleCopy(slug, 'slug')}
          >
            <Indicator isCopied={copiedButton === 'slug'} />
            <span className="truncate">{slug}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(mal_id, 'mal_id')}
          >
            <Indicator isCopied={copiedButton === 'mal_id'} />
            {mal_id}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface IndicatorProps {
  isCopied: boolean;
}

const Indicator = ({ isCopied }: IndicatorProps) => {
  return (
    <div className="relative">
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-[transform,opacity,filter] duration-200 ease-in-out will-change-[transform,opacity,filter]',
          isCopied
            ? 'scale-100 opacity-100 blur-0'
            : 'scale-[0.25] opacity-0 blur-sm',
        )}
      >
        <Check className="size-4" />
      </div>
      <div
        className={cn(
          'transition-[transform,opacity,filter] duration-200 ease-in-out will-change-[transform,opacity,filter]',
          isCopied
            ? 'scale-[0.25] opacity-0 blur-sm'
            : 'scale-100 opacity-100 blur-0',
        )}
      >
        <ClipboardCopy className="size-4" />
      </div>
    </div>
  );
};
