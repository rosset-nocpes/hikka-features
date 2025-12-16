import { QueryClientProvider } from '@tanstack/react-query';
import { Check, ClipboardCopy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { queryClient } from '..';

let isMounting = false;

const editCharSuggestion = async () => {
  if (document.body.querySelectorAll('edit-char-suggestion').length !== 0) {
    return;
  }

  if (isMounting) return;
  isMounting = true;

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'edit-char-suggestion',
    position: 'overlay',
    alignment: 'bottom-right',
    anchor: () =>
      document.querySelector('input[placeholder*="українською"]')
        ?.parentElement,
    inheritStyles: true,
    css: ':host(edit-char-suggestion) { margin-top: -1rem; width: 100% !important; }',
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.parentElement!.style.right = '0.5rem';
      container.parentElement!.style.bottom = '0.5rem';

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <EditCharSuggestion />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

const EditCharSuggestion = () => {
  const { data, isLoading } = useEditorCharacters();
  const input: HTMLInputElement | null = document.querySelector(
    'input[placeholder*="українською"]',
  );

  const [hidden, setHidden] = useState(input?.value);

  const handleClick = () => {
    if (input && data) {
      input.value = data.suggestions.name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && document.activeElement === input) {
        e.preventDefault();
        handleClick();
      }
    };

    const handleInput = (event: any) => setHidden(event.target.value);

    input?.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      input?.removeEventListener('input', handleInput);
    };
  }, [input, data]);

  const MotionButton = motion.create(Button);

  return (
    <AnimatePresence initial={false}>
      {data && !hidden && (
        <MotionButton
          key="edit-char-suggestion-button"
          variant="secondary"
          size="sm"
          className="items-center rounded-sm"
          onClick={handleClick}
          initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
        >
          {data?.suggestions.name} <Kbd>Tab</Kbd>
        </MotionButton>
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

export default editCharSuggestion;
