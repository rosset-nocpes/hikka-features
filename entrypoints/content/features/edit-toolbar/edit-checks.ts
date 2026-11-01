import type { FieldGroup, FieldKind, FieldLanguage } from './edit-fields';

/** How much an issue matters: `error` breaks the rules outright. */
export type IssueSeverity = 'error' | 'warning' | 'hint';

export interface FieldIssue {
  rule: string;
  severity: IssueSeverity;
  message: string;
  /**
   * Fixes the issue in a piece of the field's text, when that's certain: the
   * whole of a line's, or each run of a rich text editor's.
   */
  fix?: (text: string) => string;
}

export interface CheckedField {
  group: FieldGroup;
  language: FieldLanguage;
  kind: FieldKind;
  text: string;
  editable: boolean;
}

/** Letters Ukrainian lacks: the mark of text copied from Russian. */
const RUSSIAN_LETTERS = /[ыэъёЫЭЪЁ]/gu;

/** Runs of Latin and Cyrillic letters, to find words that mix the two. */
const WORD = /[\p{Script=Latin}\p{Script=Cyrillic}]+/gu;
const LATIN = /\p{Script=Latin}/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;

/** Latin letters that look the same as Cyrillic ones, and back. */
const TO_CYRILLIC: Record<string, string> = {
  A: 'А',
  B: 'В',
  C: 'С',
  E: 'Е',
  H: 'Н',
  I: 'І',
  K: 'К',
  M: 'М',
  O: 'О',
  P: 'Р',
  T: 'Т',
  X: 'Х',
  a: 'а',
  c: 'с',
  e: 'е',
  i: 'і',
  o: 'о',
  p: 'р',
  x: 'х',
  y: 'у',
};
const TO_LATIN = Object.fromEntries(
  Object.entries(TO_CYRILLIC).map(([latin, cyrillic]) => [cyrillic, latin]),
);

/**
 * The word in the script most of its letters are in, or in the field's
 * language's on a tie; undefined when a letter has no lookalike there.
 */
const unmixWord = (word: string, language: FieldLanguage) => {
  const letters = [...word];
  const latin = letters.filter((letter) => LATIN.test(letter)).length;
  const cyrillic = letters.length - latin;
  const toCyrillic =
    cyrillic > latin || (cyrillic === latin && language === 'uk');
  const map = toCyrillic ? TO_CYRILLIC : TO_LATIN;
  const minority = toCyrillic ? LATIN : CYRILLIC;
  const fixed = letters.map((letter) =>
    minority.test(letter) ? map[letter] : letter,
  );
  return fixed.every(Boolean) ? fixed.join('') : undefined;
};

const quote = (values: string[], limit = 3) =>
  values
    .slice(0, limit)
    .map((value) => `«${value}»`)
    .join(', ') + (values.length > limit ? '…' : '');

const russianLetters = ({ language, text }: CheckedField): FieldIssue[] => {
  if (language !== 'uk') return [];
  const letters = [...new Set(text.match(RUSSIAN_LETTERS))];
  if (!letters.length) return [];
  return [
    {
      rule: 'russian-letters',
      severity: 'error',
      message: `Літери, яких немає в українській: ${quote(letters, 4)}`,
    },
  ];
};

const mixedScripts = ({
  language,
  text,
  editable,
}: CheckedField): FieldIssue[] => {
  if (language === 'native') return [];
  const mixed = [
    ...new Set(
      (text.match(WORD) ?? []).filter(
        (word) => LATIN.test(word) && CYRILLIC.test(word),
      ),
    ),
  ];
  if (!mixed.length) return [];

  const fixable =
    editable && mixed.every((word) => unmixWord(word, language) !== undefined);
  return [
    {
      rule: 'mixed-scripts',
      severity: 'error',
      message: `Латиниця й кирилиця в одному слові: ${quote(mixed)}`,
      fix: fixable
        ? (part) =>
            part.replace(WORD, (word) =>
              mixed.includes(word) ? unmixWord(word, language)! : word,
            )
        : undefined,
    },
  ];
};

/** Two or more spaces in a row; a rich text editor keeps typed ones as such. */
const DOUBLE_SPACES = /[ \u00a0]{2,}/g;
const BETWEEN_WORDS = /\S[ \t\u00a0]{2,}\S/;

const collapseLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .trim();
const collapseLine = (text: string) => text.replace(/\s+/g, ' ').trim();
const collapseRuns = (text: string) => text.replace(DOUBLE_SPACES, ' ');

const spaces = ({
  group,
  kind,
  text,
  editable,
}: CheckedField): FieldIssue[] => {
  if (kind === 'rich') {
    // Rendered text says nothing of the spaces the edit has; and a
    // paragraph's edges are the Markdown's business.
    if (!editable || !BETWEEN_WORDS.test(text)) return [];
    return [
      {
        rule: 'spaces',
        severity: 'warning',
        message: 'Подвійні пробіли між словами',
        fix: collapseRuns,
      },
    ];
  }
  const collapse = group === 'comment' ? collapseLines : collapseLine;
  if (collapse(text) === text) return [];
  return [
    {
      rule: 'spaces',
      severity: 'warning',
      message: BETWEEN_WORDS.test(text)
        ? 'Подвійні пробіли між словами'
        : 'Пробіли на початку чи в кінці',
      fix: editable ? collapse : undefined,
    },
  ];
};

/** Seasons and parts written any way but the rules' «Назва - 2 сезон, 2 частина». */
const SEASON_PATTERNS = [
  /(?<!\p{L})(?:сезон|частина)\s*№?\s*\d/iu,
  /\d\s*-?\s*(?:й|ий|ій|го|а|ша)\s+(?:сезон|частина)/iu,
  /(?<!-\s)(?<![\p{L}\d])\d+\s+сезон/iu,
  /(?<![,-]\s)(?<![\p{L}\d])\d+\s+частина/iu,
  /\d+\s+(?:Сезон|Частина)/u,
  /(?<!\p{L})(?:season|part|cour)\s*\d/iu,
];

const seasonFormat = ({
  group,
  language,
  text,
}: CheckedField): FieldIssue[] => {
  if (group !== 'title' || language !== 'uk') return [];
  if (SEASON_PATTERNS.some((pattern) => pattern.test(text))) {
    return [
      {
        rule: 'season-format',
        severity: 'warning',
        message: 'Сезон і частину пишуть так: «Назва - 2 сезон, 2 частина»',
      },
    ];
  }
  // The first season goes unnumbered unless the title has parts.
  if (/ - 1 сезон(?!, \d+ частина)/u.test(text)) {
    return [
      {
        rule: 'first-season',
        severity: 'hint',
        message: 'Перший сезон у назві не вказують',
      },
    ];
  }
  return [];
};

const honorifics = ({ group, language, text }: CheckedField): FieldIssue[] => {
  if (group !== 'name' || language !== 'uk') return [];
  const issues: FieldIssue[] = [];
  if (/(?<!\p{L})(?:містер|місіс|міс)(?!\p{L})/iu.test(text)) {
    issues.push({
      rule: 'honorifics',
      severity: 'hint',
      message: '«Містер», «місіс» замінюють на «пан», «пані»',
    });
  }
  if (/(?<!\p{L})(?:проф|д-р|св)\./iu.test(text)) {
    issues.push({
      rule: 'abbreviations',
      severity: 'hint',
      message: 'Додатки до імені, як-от «професор», не скорочують',
    });
  }
  return issues;
};

/** A copied description ends with its source, an own one with its author. */
const sourceLine = ({ group, language, text }: CheckedField): FieldIssue[] => {
  if (group !== 'description' || language !== 'uk') return [];
  const lines = text
    .split('\n')
    .map((line) => line.replace(/[﻿​]/g, '').trim())
    .filter(Boolean);
  const last = lines.at(-1);
  if (!last || /^джерел[оа]/iu.test(last)) return [];
  return [
    {
      rule: 'source-line',
      severity: 'warning',
      message: 'Наприкінці опису немає рядка «Джерело …»',
    },
  ];
};

const emptyComment = ({ group, editable, text }: CheckedField): FieldIssue[] =>
  group === 'comment' && editable && !text.trim()
    ? [
        {
          rule: 'empty-comment',
          severity: 'hint',
          message:
            'Напишіть, що змінили і звідки взяли, щоб правку перевірили швидше',
        },
      ]
    : [];

const CHECKS = [
  russianLetters,
  mixedScripts,
  spaces,
  seasonFormat,
  honorifics,
  sourceLine,
  emptyComment,
];

const SEVERITY_ORDER: IssueSeverity[] = ['error', 'warning', 'hint'];

/** What a field breaks of hikka.io's editing rules, worst first. */
export function checkField(field: CheckedField): FieldIssue[] {
  if (!field.text.trim() && field.group !== 'comment') return [];
  return CHECKS.flatMap((check) => check(field)).sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
}
