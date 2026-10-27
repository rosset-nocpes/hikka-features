import {
  createContext,
  type FC,
  type ReactNode,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsGridViewRounded from '~icons/material-symbols/grid-view-rounded';
import MaterialSymbolsImageNotSupportedOutlineRounded from '~icons/material-symbols/image-not-supported-outline-rounded';
import MaterialSymbolsMicOutlineRounded from '~icons/material-symbols/mic-outline-rounded';
import MaterialSymbolsSubtitlesOutlineRounded from '~icons/material-symbols/subtitles-outline-rounded';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isTeamPagePath } from '@/utils/hikka-router';

/** The feature UI's container, where popups have to render to be styled. */
export const ContainerContext = createContext<HTMLElement | undefined>(
  undefined,
);

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** What a list is narrowed to: everything, dubs or subtitles. */
export type TypeFilter = 'all' | 'dub' | 'sub';

const TYPE_FILTERS: {
  value: TypeFilter;
  label: string;
  icon: FC<{ className?: string }>;
}[] = [
  { value: 'all', label: 'Усі', icon: MaterialSymbolsGridViewRounded },
  { value: 'dub', label: 'Озвучення', icon: MaterialSymbolsMicOutlineRounded },
  {
    value: 'sub',
    label: 'Субтитри',
    icon: MaterialSymbolsSubtitlesOutlineRounded,
  },
];

/**
 * Everything, dubs or subtitles, with how many of each: for a page's
 * floating bar. Below `sm` only the icons and counts fit.
 */
export const TypeFilterButtons: FC<{
  value: TypeFilter;
  counts: Record<TypeFilter, number>;
  onChange: (value: TypeFilter) => void;
}> = ({ value, counts, onChange }) => (
  <div role="group" aria-label="Тип перекладу" className="flex gap-1">
    {TYPE_FILTERS.map(({ value: option, label, icon: Icon }) => {
      const active = option === value;
      return (
        <Button
          key={option}
          variant="ghost"
          size="md"
          aria-pressed={active}
          aria-label={label}
          disabled={!active && counts[option] === 0}
          onClick={() => onChange(option)}
          className={cn(
            'gap-1.5 border border-transparent px-2.5',
            active &&
              'border-primary/40 bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
          )}
        >
          <Icon className="size-4.5" />
          <span className="hidden sm:inline">{label}</span>
          <span className="tabular-nums opacity-60">{counts[option]}</span>
        </Button>
      );
    })}
  </div>
);

/** A sort order dropdown, like the catalog's. */
export function SortSelect<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const container = use(ContainerContext);
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger
        aria-label="Сортування"
        className={cn(
          'h-10 rounded-lg px-3 data-[size=default]:h-10',
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        container={container}
        alignItemWithTrigger={false}
        className="text-base"
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** hikka.io's "Показати ще" under a list. */
export const LoadMoreButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button variant="ghost" size="md" onClick={onClick} className="self-center">
    <MaterialSymbolsArrowDownwardRounded />
    Показати ще
  </Button>
);

/**
 * A text cut to a few lines with hikka.io's "Показати більше..." under it,
 * when it is longer.
 */
export const TextExpand: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || open) return;
    const measure = () =>
      setLong(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <div
        ref={ref}
        className={cn(
          'w-full break-words whitespace-pre-line',
          !open && 'max-h-36 overflow-hidden',
          !open && long && 'gradient-mask-b-0',
        )}
      >
        {children}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground cursor-pointer text-sm"
        >
          {open ? 'Згорнути' : 'Показати більше...'}
        </button>
      )}
    </div>
  );
};

/** A poster in hikka.io's card ratio, with a placeholder when missing. */
export const Poster: FC<{
  image?: string;
  className?: string;
  children?: ReactNode;
}> = ({ image, className, children }) => (
  <AspectRatio
    ratio={0.7}
    className={cn(
      'bg-muted relative w-full overflow-hidden rounded-md',
      className,
    )}
  >
    <div className="bg-secondary/20 absolute inset-0 flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <MaterialSymbolsImageNotSupportedOutlineRounded className="text-muted-foreground text-4xl" />
      )}
    </div>
    {children}
  </AspectRatio>
);

/** hikka.io's subtitles under a card's title: "TV Серіал • 2026". */
export const CardMeta: FC<{ items: (string | undefined)[] }> = ({ items }) => {
  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      {shown.map((item, index) => (
        <span key={item} className="contents">
          {index > 0 && (
            <span className="bg-muted-foreground size-1 shrink-0 rounded-full" />
          )}
          <span className="text-muted-foreground text-xs leading-tight font-medium">
            {item}
          </span>
        </span>
      ))}
    </div>
  );
};

/** hikka.io's poster grid: two columns on phones, five beside the contents. */
export const POSTER_GRID =
  'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5';

/** Names the tab while the page is shown, as hikka.io names its pages. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const wanted = `${title} / Hikka`;
    const apply = () => {
      // Leaving the page, the site names the next one before this unmounts.
      if (!isTeamPagePath(location.pathname)) return;
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    // The site names the tab after the route it shows underneath, later.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [title]);
}
