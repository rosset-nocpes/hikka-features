import type { Root } from 'react-dom/client';

import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

import { queryClient } from '..';
import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class NameSuggestionFeature extends BaseFeature {
  readonly id = 'name-suggestion';
  readonly pages = [
    HikkaPages.EditCreateCharacter,
    HikkaPages.EditCreatePerson,
  ];
  private uis: {
    target: NameSuggestionTarget;
    ui: ShadowRootContentScriptUi<Root>;
  }[] = [];

  async init() {
    this.uis = await Promise.all(
      NAME_SUGGESTION_TARGETS.map(async (target) => ({
        target,
        ui: await createShadowRootUi(usePageStore.getState().ctx, {
          name: this.id,
          position: 'overlay',
          alignment: 'bottom-right',
          anchor: () => getNameSuggestionInput(target)?.parentElement,
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
                <NameSuggestionButton target={target} />
              </QueryClientProvider>,
            );

            return root;
          },
          onRemove: (root) => {
            root?.unmount();
          },
        }),
      })),
    );
  }

  override get isMounted(): boolean {
    const availableUis = this.uis.filter(({ target }) =>
      getNameSuggestionInput(target),
    );

    return (
      availableUis.length > 0 &&
      availableUis.every(({ ui }) => ui.mounted && ui.shadowHost.isConnected)
    );
  }

  override mount() {
    this.uis.forEach(({ target, ui }) => {
      if (!getNameSuggestionInput(target)) {
        return;
      }

      if (ui.mounted && ui.shadowHost.isConnected) {
        return;
      }

      if (ui.mounted) {
        ui.remove();
      }

      ui.mount();
    });
  }

  override unmount() {
    this.uis.forEach(({ ui }) => {
      if (ui.mounted) {
        ui.remove();
      }
    });
  }
}

const NAME_SUGGESTION_TARGETS = [
  { placeholder: 'українською', suggestionKey: 'name_ua' },
  { placeholder: 'англійською', suggestionKey: 'name_en' },
  { placeholder: 'японською', suggestionKey: 'name_ja' },
  { placeholder: 'оригінальне', suggestionKey: 'name_native' },
] as const;

type NameSuggestionTarget = (typeof NAME_SUGGESTION_TARGETS)[number];

const getNameSuggestionInput = (target: NameSuggestionTarget) =>
  document.querySelector<HTMLInputElement>(
    `input[placeholder*="${target.placeholder}"]`,
  );

const NameSuggestionButton = ({ target }: { target: NameSuggestionTarget }) => {
  const { data } = useEditorContent();
  const { enabled } = useSettings().features.editorCharacters;

  const targetInput = getNameSuggestionInput(target);
  const suggestion = data?.suggestion?.[target.suggestionKey];

  const [inputValue, setInputValue] = useState(targetInput?.value);

  const applySuggestion = useCallback(() => {
    if (targetInput && suggestion) {
      targetInput.value = suggestion;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));

      setInputValue(suggestion);
    }
  }, [targetInput, suggestion]);

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

  const isVisible = suggestion && !inputValue;

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
          <span>{suggestion}</span>
          <Kbd className="bg-background/50">Tab</Kbd>
        </MotionButton>
      )}
    </AnimatePresence>
  );
};
