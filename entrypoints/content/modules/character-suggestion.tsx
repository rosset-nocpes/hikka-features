import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { queryClient } from '..';

const INPUT_SELECTOR = 'input[placeholder*="українською"]';
const MOUNT_TAG = 'character-suggestion';

let isMounting = false;

export const characterSuggestion = async () => {
  const existing = document.body.querySelectorAll(MOUNT_TAG);
  if (existing.length > 0 || isMounting) return;

  isMounting = true;

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: MOUNT_TAG,
    position: 'overlay',
    alignment: 'bottom-right',
    anchor: () => document.querySelector(INPUT_SELECTOR)?.parentElement,
    inheritStyles: true,
    css: `:host(${MOUNT_TAG}) { margin-top: -1rem; width: 100% !important; }`,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      if (container.parentElement) {
        container.parentElement.style.right = '0.5rem';
        container.parentElement.style.bottom = '0.5rem';
      }

      const { darkMode } = useSettings.getState();
      container.classList.toggle('dark', darkMode);

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <CharacterSuggestionButton />
        </QueryClientProvider>,
      );

      isMounting = false;
      return { root, wrapper };
    },
  });
};

const CharacterSuggestionButton = () => {
  const { data } = useEditorCharacters();

  const targetInput: HTMLInputElement | null =
    document.querySelector(INPUT_SELECTOR);

  const [inputValue, setInputValue] = useState(targetInput?.value);

  const applySuggestion = useCallback(() => {
    if (targetInput && data?.suggestion) {
      targetInput.value = data.suggestion.name;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));

      setInputValue(data.suggestion.name);
    }
  }, [targetInput, data]);

  useEffect(() => {
    if (!targetInput) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key === 'Tab' &&
        document.activeElement === targetInput &&
        !inputValue
      ) {
        e.preventDefault();
        applySuggestion();
      }
    };

    const handleInput = (e: Event) => {
      setInputValue((e.target as HTMLInputElement).value);
    };

    targetInput.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      targetInput.removeEventListener('input', handleInput);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [targetInput, inputValue, applySuggestion]);

  const MotionButton = motion.create(Button);

  const isVisible = data?.suggestion && !inputValue;

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionButton
          layout
          variant="secondary"
          size="sm"
          className="flex items-center gap-2 rounded-sm"
          onClick={applySuggestion}
          initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
        >
          <span>{data.suggestion.name}</span>
          <Kbd className="bg-background/50">Tab</Kbd>
        </MotionButton>
      )}
    </AnimatePresence>
  );
};

export default characterSuggestion;
