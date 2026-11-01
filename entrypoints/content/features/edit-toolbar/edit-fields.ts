import { fillInput } from '@/utils/edit-form';

/**
 * The part of the content a field of hikka.io's edit form changes: a
 * title's, or a character's or person's name.
 */
export type FieldGroup =
  | 'title'
  | 'name'
  | 'description'
  | 'synonyms'
  | 'comment';

/** The language a field is written in; `native` is the original title. */
export type FieldLanguage = 'uk' | 'en' | 'native' | 'other';

/** A field's text: a line or a comment, or Markdown shown as rich text. */
export type FieldKind = 'plain' | 'rich';

export interface EditField {
  /** As the form labels it, e.g. "Назва · Українською". */
  name: string;
  group: FieldGroup;
  language: FieldLanguage;
  kind: FieldKind;
  /** Its text, one line per paragraph. */
  text: string;
  /** Whether it can be changed here, rather than only viewed. */
  editable: boolean;
  /** What the field is typed in, while it can be. */
  input?: HTMLInputElement | HTMLTextAreaElement;
  /** What to scroll to and mark. */
  element: HTMLElement;
}

export const EDIT_FORM = 'main form';

/** hikka.io's group titles; the apostrophe varies between its pages. */
const GROUPS: Record<string, FieldGroup> = {
  Назва: 'title',
  Імʼя: 'name',
  "Ім'я": 'name',
  Опис: 'description',
  Синоніми: 'synonyms',
};

const LANGUAGES: Record<string, FieldLanguage> = {
  Українською: 'uk',
  Англійською: 'en',
  Японською: 'native',
  Оригінальна: 'native',
  Оригінальне: 'native',
};

/** A field's input, rich text editor, or its rendered text when viewed. */
const CONTROL = 'input[type="text"], [data-slate-editor], .prose';

const isTextInput = (
  element: Element,
): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

/** Rich text as its paragraphs, without the editor's hidden markers. */
const richText = (control: Element) => {
  const blocks = [...control.children];
  return blocks
    .map((block) =>
      control.matches('[data-slate-editor]')
        ? [...block.querySelectorAll('[data-slate-string]')]
            .map((leaf) => leaf.textContent)
            .join('')
        : (block.textContent ?? ''),
    )
    .join('\n');
};

/**
 * The control a field label names. The label sits right in the field, or in
 * a row with the field's view switch; further up are the other fields.
 */
const controlOf = (label: Element) =>
  label.parentElement?.querySelector<HTMLElement>(CONTROL) ??
  label.parentElement?.parentElement?.querySelector<HTMLElement>(CONTROL);

const groupTitleOf = (collapsible: Element) =>
  collapsible
    .querySelector('[data-slot="collapsible-trigger"] .font-semibold')
    ?.textContent?.trim() ?? '';

/** The form's group of fields that changes `group`, e.g. the name. */
export const findFieldGroup = (group: FieldGroup) =>
  [...document.querySelectorAll(`${EDIT_FORM} [data-slot="collapsible"]`)].find(
    (collapsible) => GROUPS[groupTitleOf(collapsible)] === group,
  );

/**
 * Whether an edit's field shows its change rather than its value: a changed
 * one has "Значення" and "Різниця" tabs next to its label, the value first.
 */
const showsDiff = (label: Element) =>
  label.parentElement
    ?.querySelector('[role="tab"]')
    ?.getAttribute('aria-selected') === 'false';

const fieldOf = (label: Element): EditField | undefined => {
  const collapsible = label.closest('[data-slot="collapsible"]');
  // A closed group isn't being edited, though some keep their fields.
  if (!collapsible?.hasAttribute('data-open')) return;
  // The diff is the old and new text in one.
  if (showsDiff(label)) return;

  const groupTitle = groupTitleOf(collapsible);
  const group = GROUPS[groupTitle];
  const control = controlOf(label);
  // Synonyms are a list, edited one at a time.
  if (!group || group === 'synonyms' || !control) return;

  const labelText = label.textContent?.trim() ?? '';
  const plain = isTextInput(control);
  const input = plain && !control.disabled ? control : undefined;
  return {
    name: `${groupTitle} · ${labelText}`,
    group,
    language: LANGUAGES[labelText] ?? 'other',
    kind: plain ? 'plain' : 'rich',
    text: plain ? control.value : richText(control),
    editable: plain
      ? !!input
      : control.matches('[data-slate-editor][contenteditable="true"]'),
    input,
    element: control,
  };
};

/** The edit's comment: why it's made and where from. */
const commentOf = (form: Element): EditField | undefined => {
  const textarea = form.querySelector('textarea');
  if (!textarea) return;
  return {
    name: 'Опис правки',
    group: 'comment',
    language: 'uk',
    kind: 'plain',
    text: textarea.value,
    editable: !textarea.disabled,
    input: textarea.disabled ? undefined : textarea,
    element: textarea,
  };
};

/** The fields of the edit form on the page that are open to read. */
export function readEditFields(): EditField[] {
  const form = document.querySelector(EDIT_FORM);
  if (!form) return [];
  const fields = [
    ...form.querySelectorAll('[data-slot="collapsible"] label'),
  ].flatMap((label) => fieldOf(label) ?? []);
  const comment = commentOf(form);
  return comment ? [...fields, comment] : fields;
}

/** Scrolls to a field, focuses it when it can be typed in, and marks it. */
export function revealField(field: EditField) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  field.element.scrollIntoView({
    block: 'center',
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
  field.input?.focus({ preventScroll: true });
  if (reduceMotion) return;
  field.element.animate(
    [
      { outline: '2px solid var(--ring)', outlineOffset: '2px' },
      { outline: '2px solid transparent', outlineOffset: '2px' },
    ],
    { duration: 1200, easing: 'ease-out' },
  );
}

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Selects what `fix` changes in a run of the editor's text and types the
 * change over it, as the user would: the editor keeps its own state and
 * ignores the page's text changing under it.
 */
const fixRun = (leaf: Element, fix: (text: string) => string) => {
  const node = leaf.firstChild;
  const before = node?.textContent ?? '';
  const after = fix(before);
  if (!node || after === before) return false;

  let start = 0;
  while (before[start] === after[start]) start++;
  let end = 0;
  while (
    end < Math.min(before.length, after.length) - start &&
    before.at(-1 - end) === after.at(-1 - end)
  ) {
    end++;
  }
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, before.length - end);
  const selection = getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const replacement = after.slice(start, after.length - end);
  return replacement
    ? document.execCommand('insertText', false, replacement)
    : document.execCommand('delete');
};

/** Fixes a field's text, the whole of an input's or a rich editor's runs. */
export async function applyFix(
  field: EditField,
  fix: (text: string) => string,
) {
  if (field.input) {
    fillInput(field.input, fix(field.input.value));
    return;
  }
  const editor = field.element;
  if (!field.editable) return;
  editor.focus({ preventScroll: true });
  // The editor renders each change a frame later; a run at a time keeps
  // every selection on what's on screen.
  let last: string | undefined;
  for (let changes = 0; changes < 100; changes++) {
    const leaf = [...editor.querySelectorAll('[data-slate-string]')].find(
      (leaf) => fix(leaf.textContent ?? '') !== leaf.textContent,
    );
    // Stops, too, when the editor turns a change down.
    if (!leaf || leaf.textContent === last || !fixRun(leaf, fix)) break;
    last = leaf.textContent;
    await nextFrame();
  }
  const selection = getSelection();
  if (selection?.rangeCount) selection.collapseToEnd();
}
