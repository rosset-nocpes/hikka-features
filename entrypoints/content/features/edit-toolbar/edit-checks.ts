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
  /** Where in the field's text it is, to mark there; none when it's missing text. */
  ranges?: TextRange[];
}

/**
 * A piece of a field's text: where it starts, where the next begins, and
 * what's wrong with this piece in particular, when the issue's spread out.
 */
export type TextRange = [start: number, end: number, note?: string];

interface CheckedField {
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
const LATIN_RUN = /\p{Script=Latin}+/gu;
const CYRILLIC_RUN = /\p{Script=Cyrillic}+/gu;

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
 * The script of a mixed word's stray letters: the one fewer of its letters
 * are in, or on a tie the one that isn't the field's language's.
 */
const strayScript = (word: string, language: FieldLanguage) => {
  const letters = [...word];
  const latin = letters.filter((letter) => LATIN.test(letter)).length;
  const cyrillic = letters.length - latin;
  return cyrillic > latin || (cyrillic === latin && language === 'uk')
    ? 'latin'
    : 'cyrillic';
};

/**
 * The word with its stray letters swapped for their lookalikes; undefined
 * when one has none.
 */
const unmixWord = (word: string, language: FieldLanguage) => {
  const toCyrillic = strayScript(word, language) === 'latin';
  const map = toCyrillic ? TO_CYRILLIC : TO_LATIN;
  const stray = toCyrillic ? LATIN : CYRILLIC;
  const fixed = [...word].map((letter) =>
    stray.test(letter) ? map[letter] : letter,
  );
  return fixed.every(Boolean) ? fixed.join('') : undefined;
};

/** Where `pattern` matches in `text`, each match `keep` takes. */
const rangesOf = (
  text: string,
  pattern: RegExp,
  keep: (match: string) => boolean = () => true,
): TextRange[] =>
  [
    ...text.matchAll(
      pattern.global ? pattern : new RegExp(pattern, `${pattern.flags}g`),
    ),
  ]
    .filter(([match]) => match && keep(match))
    .map((match) => [match.index, match.index + match[0].length]);

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
      ranges: rangesOf(text, RUSSIAN_LETTERS),
    },
  ];
};

/** A field's words with letters in both scripts. */
const wordsOf = (text: string, keep: (word: string) => boolean) =>
  [...text.matchAll(WORD)].filter(([word]) => keep(word));

/** A word's letters in `script`: their runs, and the letters themselves. */
const lettersIn = (
  { 0: word, index }: RegExpExecArray,
  script: 'latin' | 'cyrillic',
) => {
  const pattern = script === 'latin' ? LATIN_RUN : CYRILLIC_RUN;
  const runs = [...word.matchAll(pattern)];
  return {
    ranges: runs.map((run): TextRange => [
      index + run.index,
      index + run.index + run[0].length,
    ]),
    letters: [...new Set(runs.flatMap(([run]) => [...run]))],
  };
};

/** E.g. «кирилична «а»»: what's said of a word's letters in the wrong script. */
const describeLetters = (letters: string[], script: 'latin' | 'cyrillic') => {
  const many = letters.length > 1;
  const adjective =
    script === 'cyrillic'
      ? many
        ? 'кириличні'
        : 'кирилична'
      : many
        ? 'латинські'
        : 'латинська';
  return `${adjective} ${quote(letters, 4)}`;
};

/** Descriptions of words, each once, the first few of them. */
const listWords = (descriptions: string[], limit = 3) => {
  const unique = [...new Set(descriptions)];
  return unique.slice(0, limit).join('; ') + (unique.length > limit ? '…' : '');
};

const mixedScripts = ({
  group,
  language,
  text,
  editable,
}: CheckedField): FieldIssue[] => {
  // An English name takes no Cyrillic at all: `cyrillicInEnglishName`'s.
  if (language === 'native' || (group === 'name' && language === 'en')) {
    return [];
  }
  const words = wordsOf(
    text,
    (word) => LATIN.test(word) && CYRILLIC.test(word),
  );
  if (!words.length) return [];

  const title = 'Латиниця й кирилиця в одному слові';
  const ranges: TextRange[] = [];
  const descriptions = words.map((match) => {
    const script = strayScript(match[0], language);
    const stray = lettersIn(match, script);
    const description = `${describeLetters(stray.letters, script)} в «${match[0]}»`;
    ranges.push(
      ...stray.ranges.map(([start, end]): TextRange => [
        start,
        end,
        `${title}: ${description}`,
      ]),
    );
    return description;
  });
  const mixed = words.map(([word]) => word);
  const fixable =
    editable && mixed.every((word) => unmixWord(word, language) !== undefined);
  return [
    {
      rule: 'mixed-scripts',
      severity: 'error',
      message: `${title}: ${listWords(descriptions)}`,
      ranges,
      fix: fixable
        ? (part) =>
            part.replace(WORD, (word) =>
              mixed.includes(word) ? unmixWord(word, language)! : word,
            )
        : undefined,
    },
  ];
};

/**
 * Cyrillic in a name's English spelling: lookalike letters slipped into a
 * Latin word, or the Ukrainian name typed in the wrong field.
 */
const cyrillicInEnglishName = ({
  group,
  language,
  text,
  editable,
}: CheckedField): FieldIssue[] => {
  if (group !== 'name' || language !== 'en') return [];
  const words = wordsOf(text, (word) => CYRILLIC.test(word));
  if (!words.length) return [];

  const title = 'Кирилиця в англійському імені';
  const ranges: TextRange[] = [];
  const descriptions = words.map((match) => {
    const word = match[0];
    const cyrillic = lettersIn(match, 'cyrillic');
    const description = LATIN.test(word)
      ? `${describeLetters(cyrillic.letters, 'cyrillic')} в «${word}»`
      : `усе слово «${word}»`;
    ranges.push(
      ...cyrillic.ranges.map(([start, end]): TextRange => [
        start,
        end,
        `${title}: ${description}`,
      ]),
    );
    return description;
  });

  // Only lookalike letters: Latin ones the keyboard or a copy swapped.
  const fixable =
    editable &&
    [...text.matchAll(CYRILLIC_RUN)].every(([run]) =>
      [...run].every((letter) => TO_LATIN[letter]),
    );
  return [
    {
      rule: 'cyrillic-in-english',
      severity: 'error',
      message: `${title}: ${listWords(descriptions)}`,
      ranges,
      fix: fixable
        ? (part) =>
            part.replace(CYRILLIC_RUN, (run) =>
              [...run].map((letter) => TO_LATIN[letter] ?? letter).join(''),
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

/** The spaces `collapseLines` and `collapseLine` take out or change. */
const EXTRA_LINE_SPACES = /^\s+|\s+$|[ \t]+(?=\n)|[ \t]{2,}|\t/g;
const EXTRA_SPACES = /^\s+|\s+$|\s{2,}|[^\S ]/g;

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
        ranges: rangesOf(text, DOUBLE_SPACES),
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
      ranges: rangesOf(
        text,
        group === 'comment' ? EXTRA_LINE_SPACES : EXTRA_SPACES,
      ),
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
  const season = SEASON_PATTERNS.flatMap((pattern) => rangesOf(text, pattern));
  if (season.length) {
    return [
      {
        rule: 'season-format',
        severity: 'warning',
        message: 'Сезон і частину пишуть так: «Назва - 2 сезон, 2 частина»',
        ranges: season,
      },
    ];
  }
  // The first season goes unnumbered unless the title has parts.
  const first = rangesOf(text, / - 1 сезон(?!, \d+ частина)/u);
  if (first.length) {
    return [
      {
        rule: 'first-season',
        severity: 'hint',
        message: 'Перший сезон у назві не вказують',
        ranges: first,
      },
    ];
  }
  return [];
};

const honorifics = ({ group, language, text }: CheckedField): FieldIssue[] => {
  if (group !== 'name' || language !== 'uk') return [];
  const issues: FieldIssue[] = [];
  const titles = rangesOf(text, /(?<!\p{L})(?:містер|місіс|міс)(?!\p{L})/iu);
  if (titles.length) {
    issues.push({
      rule: 'honorifics',
      severity: 'hint',
      message: '«Містер», «місіс» замінюють на «пан», «пані»',
      ranges: titles,
    });
  }
  const abbreviations = rangesOf(text, /(?<!\p{L})(?:проф|д-р|св)\./iu);
  if (abbreviations.length) {
    issues.push({
      rule: 'abbreviations',
      severity: 'hint',
      message: 'Додатки до імені, як-от «професор», не скорочують',
      ranges: abbreviations,
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
  cyrillicInEnglishName,
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
