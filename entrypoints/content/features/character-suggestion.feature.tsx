import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class CharacterSuggestionFeature extends BaseFeature {
  readonly id = 'character-suggestion';
  readonly pages = [HikkaPages.EditCreateCharacter];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'overlay',
      alignment: 'bottom-right',
      anchor: () =>
        document.querySelector('input[placeholder*="українською"]')
          ?.parentElement,
      inheritStyles: true,
      css: `:host(${this.id}) { margin-top: -1rem !important; width: 100% !important; }`,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);

        container.style = getThemeVariables();
        container.classList.toggle(
          'dark',
          getComputedStyle(document.documentElement).colorScheme === 'dark',
        );

        if (container.parentElement) {
          container.parentElement.style.right = '0.25rem';
          container.parentElement.style.bottom = '0.25rem';
        }

        const root = createRoot(wrapper);
        root.render(
          <QueryClientProvider client={queryClient}>
            <CharacterSuggestionButton />
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

const CharacterSuggestionButton = () => {
  const { data } = useEditorCharacters();
  const { enabled } = useSettings().features.editorCharacters;

  const targetInput: HTMLInputElement | null = document.querySelector(
    'input[placeholder*="українською"]',
  );

  const [inputValue, setInputValue] = useState(targetInput?.value);

  const applySuggestion = useCallback(() => {
    if (targetInput && data?.suggestion) {
      targetInput.value = data.suggestion.name;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));

      setInputValue(data.suggestion.name);
    }
  }, [targetInput, data]);

  useEffect(() => {
    if (!targetInput || !enabled) return;

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
  }, [enabled, targetInput, inputValue, applySuggestion]);

  const MotionButton = motion.create(Button);

  const isVisible = data?.suggestion && !inputValue;

  return (
    <AnimatePresence>
      {enabled && isVisible && (
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
