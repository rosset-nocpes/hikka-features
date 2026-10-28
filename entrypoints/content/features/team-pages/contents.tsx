import {
  createContext,
  type FC,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import MaterialSymbolsToc from '~icons/material-symbols/toc';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { ContainerContext } from './parts';

/** A part of the page listed in its contents. */
export interface ContentsEntry {
  id: string;
  title: string;
  count?: number;
}

/** The sections on the page, by id, for the contents to follow. */
const SectionsContext = createContext<Map<string, HTMLElement>>(new Map());

/**
 * The section the reader is in: the last whose heading has reached the line
 * a jump to it lands on. A clicked one stays chosen through its jump, even
 * when the page can't scroll it that far.
 */
function useActiveSection(entries: ContentsEntry[]) {
  const sections = use(SectionsContext);
  const pinned = useRef<string | null>(null);
  const [active, setActive] = useState<string | undefined>(entries[0]?.id);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (pinned.current) return;
      let current = entries[0]?.id;
      for (const { id } of entries) {
        const section = sections.get(id);
        if (!section) continue;
        const margin =
          Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        if (section.getBoundingClientRect().top > margin + 1) break;
        current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    const unpin = () => {
      pinned.current = null;
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const type of ['wheel', 'pointerdown', 'keydown'] as const) {
      window.addEventListener(type, unpin, { passive: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      for (const type of ['wheel', 'pointerdown', 'keydown'] as const) {
        window.removeEventListener(type, unpin);
      }
    };
  }, [entries, sections]);

  const jump = useCallback(
    (id: string) => {
      pinned.current = id;
      setActive(id);
      sections.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [sections],
  );

  return { active, jump };
}

/** "Зміст": the page's sections, as on hikka.io's collections. */
const Contents: FC<{
  entries: ContentsEntry[];
  onJump?: () => void;
  className?: string;
}> = ({ entries, onJump, className }) => {
  const { active, jump } = useActiveSection(entries);
  return (
    <nav
      aria-label="Зміст"
      className={cn(
        'surface border-border flex min-h-0 flex-col gap-4 rounded-lg border p-4',
        className,
      )}
    >
      <h2 className="text-base font-bold">Зміст</h2>
      <ul className="no-scrollbar -m-4 flex flex-col gap-2.5 overflow-y-auto p-4 text-sm">
        {entries.map(({ id, title, count }) => (
          <li key={id}>
            <button
              type="button"
              aria-current={active === id ? 'location' : undefined}
              onClick={() => {
                jump(id);
                onJump?.();
              }}
              className={cn(
                'flex w-full cursor-pointer items-baseline gap-2 text-left underline-offset-4 hover:underline',
                active === id
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground',
              )}
            >
              <span className="line-clamp-2 flex-1">{title}</span>
              {count !== undefined && (
                <span className="text-muted-foreground text-xs font-normal tabular-nums">
                  {count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/** The contents in a popover from the floating bar, below `lg`. */
const ContentsPopover: FC<{ entries: ContentsEntry[] }> = ({ entries }) => {
  const container = use(ContainerContext);
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-md"
            aria-label="Зміст"
            className="lg:hidden"
          />
        }
      >
        <MaterialSymbolsToc />
      </PopoverTrigger>
      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-64 gap-0 p-0 text-base"
      >
        <Contents
          entries={entries}
          onJump={() => setOpen(false)}
          className="max-h-96 border-none bg-transparent shadow-none"
        />
      </PopoverContent>
    </Popover>
  );
};

/**
 * hikka.io's collection page: one centred column, the contents beside it
 * from `lg`, and a floating bar at the bottom with `bar` and, on smaller
 * screens, the contents.
 */
export const ContentsLayout: FC<{
  entries: ContentsEntry[];
  bar?: ReactNode;
  children: ReactNode;
}> = ({ entries, bar, children }) => {
  const [sections] = useState(() => new Map<string, HTMLElement>());
  const hasBar = !!bar || entries.length > 0;

  return (
    <SectionsContext value={sections}>
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-4">
        {/* Balances the contents, so the column stays centred. */}
        <div className="hidden max-w-56 min-w-52 lg:block" />
        <div className="mx-auto flex w-full max-w-[52rem] min-w-0 flex-col gap-12">
          {children}
        </div>
        <div className="hidden max-w-56 min-w-52 lg:block">
          {entries.length > 0 && (
            <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col">
              <Contents
                entries={entries}
                className="max-h-[70vh] opacity-60 transition-opacity hover:opacity-100"
              />
            </div>
          )}
        </div>
      </div>
      {hasBar && (
        <div
          className={cn(
            'sticky bottom-[calc(var(--tab-bar-height,0px)+1rem)] z-10 mx-auto mt-8 flex w-fit',
            !bar && 'lg:hidden',
          )}
        >
          <div className="surface-glass border-border flex items-center gap-2 rounded-lg border px-3 py-2">
            {bar}
            {bar && entries.length > 0 && (
              <div className="bg-border h-6 w-px lg:hidden" />
            )}
            {entries.length > 0 && <ContentsPopover entries={entries} />}
          </div>
        </div>
      )}
    </SectionsContext>
  );
};

/** A part of the page the contents list: a heading and what's under it. */
export const ContentsSection: FC<
  ContentsEntry & { children: ReactNode; className?: string }
> = ({ id, title, count, children, className }) => {
  const sections = use(SectionsContext);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      sections.set(id, element);
      return () => {
        if (sections.get(id) === element) sections.delete(id);
      };
    },
    [id, sections],
  );
  return (
    <section
      ref={ref}
      aria-label={title}
      className={cn('flex scroll-mt-20 flex-col gap-4', className)}
    >
      <h3 className="flex min-h-8 items-center gap-1.5 text-base leading-6 font-semibold">
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground font-medium tabular-nums">
            {count}
          </span>
        )}
      </h3>
      {children}
    </section>
  );
};
