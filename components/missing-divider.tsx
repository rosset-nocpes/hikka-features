import type { FC } from 'react';

import { plural } from '@/utils/plural';

/** "Бракує 1 епізоду", "Бракує 3 епізодів". */
const nouns = {
  episode: { one: 'епізоду', few: 'епізодів', many: 'епізодів' },
  chapter: { one: 'розділу', few: 'розділів', many: 'розділів' },
};

/**
 * Whole numbers skipped between an entry and the one numbered just below it,
 * counted the way Mihon does. With nothing below, counts from 1, so a list
 * that starts at episode 4 is missing 3.
 */
export const countMissing = (number: number, below = 0) => {
  if (!Number.isFinite(number) || !Number.isFinite(below)) return 0;
  return Math.max(Math.floor(number) - Math.floor(below) - 1, 0);
};

interface Props {
  count: number;
  noun: keyof typeof nouns;
  className?: string;
}

/** Labelled rule placed where a numbered list skips entries. */
const MissingDivider: FC<Props> = ({ count, noun, className }) => {
  return (
    <div
      className={cn(
        'text-muted-foreground flex h-6 items-center gap-3 px-2 text-xs font-medium',
        className,
      )}
    >
      <span className="bg-muted-foreground/30 h-px flex-1" />
      <span className="shrink-0">
        Бракує {count} {plural(count, nouns[noun])}
      </span>
      <span className="bg-muted-foreground/30 h-px flex-1" />
    </div>
  );
};

export default MissingDivider;
