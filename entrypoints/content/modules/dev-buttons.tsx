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

  const data = useHikka().data;
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
            {copiedButton === 'slug' ? (
              <Check className="size-4" />
            ) : (
              <ClipboardCopy className="size-4" />
            )}
            {slug}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(mal_id, 'mal_id')}
          >
            {copiedButton === 'mal_id' ? (
              <Check className="size-4" />
            ) : (
              <ClipboardCopy className="size-4" />
            )}
            {mal_id}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default devButtons;
