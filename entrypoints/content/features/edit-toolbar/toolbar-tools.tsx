import { type FC, type ReactElement, useEffect, useState } from 'react';
import MaterialSymbolsCheckRounded from '~icons/material-symbols/check-rounded';
import MaterialSymbolsChevronLeftRounded from '~icons/material-symbols/chevron-left-rounded';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsFormatQuoteOutlineRounded from '~icons/material-symbols/format-quote-outline-rounded';
import MaterialSymbolsTranslateRounded from '~icons/material-symbols/translate-rounded';

import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useEditorContent from '@/hooks/use-editor-content';
import { fillInput } from '@/utils/edit-form';
import { navigateOnHikka } from '@/utils/hikka-router';

import { EDIT_FORM, findFieldGroup } from './edit-fields';
import {
  type CheckedEditField,
  findPendingEdit,
  useEditedContent,
  useHikkaUsername,
} from './use-edit-page';

/** A toolbar button's name, shown on hover and read out. */
const Hint: FC<{
  label: string;
  container: HTMLElement;
  children: ReactElement;
}> = ({ label, container, children }) => (
  <Tooltip>
    <TooltipTrigger aria-label={label} render={children} />
    <TooltipContent container={container} side="top" sideOffset={12}>
      {label}
    </TooltipContent>
  </Tooltip>
);

/** MyAnimeList's path for each of hikka.io's content types. */
const MAL_PATHS: Record<string, string> = {
  anime: 'anime',
  manga: 'manga',
  novel: 'manga',
  character: 'character',
  person: 'people',
};

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!,
  );

/**
 * The line the rules end a description with, as a link the site's editor
 * pastes as one, and as Markdown elsewhere.
 */
const copySourceLine = async (title: string, href: string) => {
  const markdown = `Джерело [${title}](${href})`;
  const html = `Джерело <a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([markdown], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(markdown);
  }
};

/** "Джерело": copies the description's closing source line. */
export const SourceMenu: FC<{ container: HTMLElement }> = ({ container }) => {
  const { content, type } = useEditedContent();
  const username = useHikkaUsername();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const malPath = type && MAL_PATHS[type];
  const sources = [
    content?.mal_id &&
      malPath && {
        title: 'MyAnimeList',
        href: `https://myanimelist.net/${malPath}/${content.mal_id}`,
        note: 'Опис звідти',
      },
    username && {
      title: `@${username}`,
      href: `https://hikka.io/u/${username}`,
      note: 'Свій опис',
    },
  ].filter((source) => !!source);

  if (!sources.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="md"
            className="gap-2"
            aria-label="Рядок із джерелом"
          />
        }
      >
        <SwapIcon
          active={copied}
          on={<MaterialSymbolsCheckRounded className="text-success size-4" />}
          off={<MaterialSymbolsFormatQuoteOutlineRounded className="size-4" />}
          className="size-4"
        />
        <span className="hidden sm:inline">Джерело</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        container={container}
        side="top"
        align="center"
        sideOffset={12}
        className="w-64"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Скопіювати рядок для кінця опису
          </DropdownMenuLabel>
          {sources.map(({ title, href, note }) => (
            <DropdownMenuItem
              key={href}
              onClick={() =>
                void copySourceLine(title, href).then(() => setCopied(true))
              }
            >
              <span className="min-w-0 flex-1 truncate">Джерело {title}</span>
              <span className="text-muted-foreground text-xs">{note}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UK_NAME_INPUT = `${EDIT_FORM} input[placeholder*="українською"]`;

/** Resolves with what `find` finds once the page renders it, or undefined. */
const waitFor = <T,>(find: () => T | null | undefined, timeoutMs = 1000) =>
  new Promise<T | undefined>((resolve) => {
    const started = performance.now();
    const check = () => {
      const found = find();
      if (found) resolve(found);
      else if (performance.now() - started > timeoutMs) resolve(undefined);
      else requestAnimationFrame(check);
    };
    check();
  });

/**
 * Opens the name group and its Ukrainian field, as the user would, and types
 * `name` in.
 */
const fillUkrainianName = async (name: string) => {
  const group = findFieldGroup('name');
  if (!group) return;
  if (!group.hasAttribute('data-open')) {
    group
      .querySelector<HTMLElement>('[data-slot="collapsible-trigger"]')
      ?.click();
  }
  if (!document.querySelector(UK_NAME_INPUT)) {
    [...group.querySelectorAll<HTMLElement>('button')]
      .find((button) => button.textContent?.trim() === 'Українською')
      ?.click();
  }
  const input = await waitFor(() =>
    document.querySelector<HTMLInputElement>(UK_NAME_INPUT),
  );
  if (!input) return;
  fillInput(input, name);
  input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  input.focus({ preventScroll: true });
};

/**
 * The suggested Ukrainian name of a character or person, typed into the
 * form in one click while it has none.
 */
export const NameFillButton: FC<{
  fields: CheckedEditField[];
  container: HTMLElement;
}> = ({ fields, container }) => {
  const { enabled } = useSettings().features.editorCharacters;
  const { content, type } = useEditedContent();
  const supported = type === 'character' || type === 'person';
  const { data } = useEditorContent(supported && enabled);
  const suggestion = data?.suggestion?.name_ua;
  const field = fields.find(
    ({ group, language }) => group === 'name' && language === 'uk',
  );
  // A closed group keeps what was typed in its field.
  const current =
    field?.text ??
    document.querySelector<HTMLInputElement>(UK_NAME_INPUT)?.value ??
    content?.name_ua;

  if (!supported || !enabled || !suggestion || current?.trim()) return null;

  return (
    <Hint label={`Вставити імʼя: ${suggestion}`} container={container}>
      <Button
        variant="ghost"
        size="md"
        className="gap-2"
        onClick={() => void fillUkrainianName(suggestion)}
      >
        <MaterialSymbolsTranslateRounded />
        <span className="hidden max-w-48 truncate sm:inline">{suggestion}</span>
      </Button>
    </Hint>
  );
};

type QueueDirection = 'previous' | 'next';

const QUEUE_LABELS: Record<QueueDirection, string> = {
  previous: 'Попередня правка на розгляді',
  next: 'Наступна правка на розгляді',
};

/** Goes to the pending edit before or after this one. */
const QueueButton: FC<{
  editId: number;
  direction: QueueDirection;
  container: HTMLElement;
}> = ({ editId, direction, container }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'none'>('idle');

  const find = () => findPendingEdit(editId, direction);
  const go = async () => {
    setState('loading');
    const target = await find().catch(() => null);
    if (target) navigateOnHikka(`/edit/${target}`);
    // A failed lookup can be tried again.
    setState(target === undefined ? 'none' : 'idle');
  };

  const Icon =
    direction === 'next'
      ? MaterialSymbolsChevronRightRounded
      : MaterialSymbolsChevronLeftRounded;
  return (
    <Hint
      label={
        state === 'none'
          ? 'Інших правок на розгляді немає'
          : QUEUE_LABELS[direction]
      }
      container={container}
    >
      <Button
        variant="ghost"
        size="icon-md"
        disabled={state === 'none'}
        focusableWhenDisabled
        className="aria-disabled:opacity-50"
        // Warms the queue up, so the click goes straight there.
        onPointerEnter={() => void find().catch(() => undefined)}
        onClick={() => {
          if (state === 'idle') void go();
        }}
      >
        {state === 'loading' ? (
          <Spinner aria-label="Шукаємо правку" />
        ) : (
          <Icon />
        )}
      </Button>
    </Hint>
  );
};

/**
 * The pending edits next to this one, for going through the queue. Each
 * edit's buttons start afresh.
 */
export const QueueButtons: FC<{ editId: number; container: HTMLElement }> = (
  props,
) => (
  <>
    <QueueButton
      key={`${props.editId}-previous`}
      direction="previous"
      {...props}
    />
    <QueueButton key={`${props.editId}-next`} direction="next" {...props} />
  </>
);
