import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

import { AnchoredUisFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class NameSuggestionFeature extends AnchoredUisFeature {
  readonly id = 'name-suggestion';
  readonly pages = [
    HikkaPages.EditCreateCharacter,
    HikkaPages.EditCreatePerson,
    HikkaPages.AllContent,
  ];

  async init() {
    this.uis = await Promise.all(
      NAME_SUGGESTION_TARGETS.map(async (target) => {
        const ui = await createFeatureUi({
          name: this.id,
          position: 'overlay',
          alignment: 'bottom-right',
          anchor: () => getNameSuggestionInput(target)?.parentElement,
          hostCss: 'margin-top: -1rem !important; width: 100% !important;',
          onMount(container) {
            container.style.right = '0.25rem';
            container.style.bottom = '0.25rem';
          },
          render: () => <NameSuggestionButton target={target} />,
        });
        return {
          present: () => !!getNameSuggestionInput(target),
          ui,
          element: () => ui.shadowHost,
        };
      }),
    );
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

/** Types `value` into the site's input the way the user would. */
const fillInput = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const NameSuggestionButton = ({ target }: { target: NameSuggestionTarget }) => {
  const { data } = useEditorContent();
  const { enabled } = useSettings().features.editorCharacters;
  const suggestion = data?.suggestion?.[target.suggestionKey];
  const [inputValue, setInputValue] = useState(
    () => getNameSuggestionInput(target)?.value,
  );

  const applySuggestion = () => {
    const input = getNameSuggestionInput(target);
    if (input && suggestion) fillInput(input, suggestion);
  };

  // Tab in the empty input takes the suggestion.
  useEffect(() => {
    const input = getNameSuggestionInput(target);
    if (!input || !enabled) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key === 'Tab' &&
        document.activeElement === input &&
        !input.value &&
        suggestion
      ) {
        e.preventDefault();
        fillInput(input, suggestion);
      }
    };
    const handleInput = () => setInputValue(input.value);

    input.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      input.removeEventListener('input', handleInput);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [enabled, target, suggestion]);

  const isVisible = enabled && suggestion && !inputValue;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
        >
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 rounded-sm"
            onClick={applySuggestion}
          >
            <span>{suggestion}</span>
            <Kbd className="bg-background/50">Tab</Kbd>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
