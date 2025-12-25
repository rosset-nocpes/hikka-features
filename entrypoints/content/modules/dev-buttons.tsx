import { QueryClientProvider } from '@tanstack/react-query';
import { Check, ClipboardCopy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { queryClient } from '..';

const devButtons = async () => {
  if (document.body.querySelectorAll('dev-buttons').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'dev-buttons',
    position: 'inline',
    append: 'last',
    anchor: document.querySelector(
      'main > div > div.flex.flex-col.gap-12 > div.flex.flex-col.gap-4',
    ),
    css: ':host(dev-buttons) { margin-bottom: -1rem; }',
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <DevButtons />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

const DevButtons = () => {
  const [show, toggleShow] = useState<boolean | null>(null);
  const [copiedButton, setCopiedButton] = useState<string | null>(null);

  useEffect(() => {
    const initializeAsync = async () => {
      toggleShow(await devMode.getValue());
    };

    initializeAsync();
  }, []);

  devMode.watch((state) => toggleShow(state));

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
      {show && (
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(slug, 'slug')}
          >
            <Indicator isCopied={copiedButton === 'slug'} />
            {slug}
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
            : 'scale-25 opacity-0 blur-xs',
        )}
      >
        <Check className="size-4" />
      </div>
      <div
        className={cn(
          'transition-[transform,opacity,filter] duration-200 ease-in-out will-change-[transform,opacity,filter]',
          isCopied
            ? 'scale-25 opacity-0 blur-xs'
            : 'scale-100 opacity-100 blur-0',
        )}
      >
        <ClipboardCopy className="size-4" />
      </div>
    </div>
  );
};

export default devButtons;
