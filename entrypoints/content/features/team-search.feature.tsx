import { useQuery } from '@tanstack/react-query';
import { Check, Ellipsis } from 'lucide-react';
import {
  type FC,
  Fragment,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import MaterialSymbolsGroupsRounded from '~icons/material-symbols/groups-rounded';

import { convexApi, type TeamListing } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import {
  isTeamPagePath,
  navigateOnHikka,
  TEAM_SEARCH_PARAM,
  teamPagePath,
} from '@/utils/hikka-router';

import { AnchoredUisFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

/**
 * hikka.io's search (`features/search/search-modal.tsx`) is a cmdk command
 * menu in a dialog, and its type toggle another cmdk list in a popover
 * (`components/ui/select.tsx`). The results get a "Команди" group of our
 * own and the toggle a "Команди" type, which lists only teams. Both live in
 * the site's DOM, so they are built from its class strings.
 */
const SEARCH_INPUT = '[cmdk-input][placeholder="Пошук..."]';
/**
 * The search type the group shows in, by its label in the type toggle: the
 * one with a group per type. The others list one type without a heading.
 */
const ALL_TYPES = 'Усе';
/** hikka.io's `API_LIMITS.searchQuery.min`. */
const MIN_QUERY = 2;
/** Teams shown in "Усе", as many as the site shows of each type there. */
const SHOWN = 3;
/** Teams shown in "Команди" before "show all". */
const SHOWN_ALONE = 20;
const TEAMS_LABEL = 'Команди';

const GROUP =
  'overflow-hidden text-foreground **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:text-xs p-0! **:[[cmdk-group-heading]]:px-3!';
const ITEM =
  "relative flex cursor-pointer select-none items-center gap-2 p-2! text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected='true']:bg-muted data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-none! border-t px-3! first:border-t-0";
const FOOTER = 'justify-center rounded-none border-y text-muted-foreground';

/** Marks our items among the site's. */
const OWN_ITEM = 'data-hikka-features-team';
const ITEMS = '[cmdk-item=""]:not([aria-disabled="true"])';

const isOwn = (item: Element | undefined) => !!item?.hasAttribute(OWN_ITEM);
const isSelected = (item: Element) =>
  item.getAttribute('aria-selected') === 'true';

/** On the search's cmdk root (`results`) and the toggle's (`toggle`) in "Команди". */
const TEAMS_MODE = 'data-hikka-features-teams-search';

/**
 * Whether "Команди" is the search type. Like the site's types it outlasts
 * the dialog, and like them it is set by the page the search opens on.
 */
let teamsMode = false;
const modeListeners = new Set<() => void>();

const setTeamsMode = (on: boolean) => {
  if (on === teamsMode) return;
  teamsMode = on;
  for (const listener of modeListeners) listener();
};

const useTeamsMode = () =>
  useSyncExternalStore(
    (listener) => {
      modeListeners.add(listener);
      return () => modeListeners.delete(listener);
    },
    () => teamsMode,
  );

/** Pages the site opens its search on with their type (`use-search-modal.ts`). */
const TYPED_PAGE = /^\/(anime|manga|novel|characters|people|u)(\/|$)/;

/**
 * Whether the open search is the site's own, from the navbar, the mobile
 * tab bar or the `/` key, and not one of its pickers (a collection's or an
 * article's), which pick titles without leaving the page.
 */
let siteSearch = false;

const followSearchOpener = (event: Event) => {
  if (document.querySelector(SEARCH_INPUT)) return;
  const target = event.target instanceof Element ? event.target : null;
  if (event instanceof KeyboardEvent && event.key === '/') {
    siteSearch = !target?.closest('input, textarea, [role="textbox"]');
  } else {
    siteSearch = !!target?.closest('header nav, nav.fixed');
  }
  if (!siteSearch) return;
  if (isTeamPagePath(location.pathname)) setTeamsMode(true);
  else if (TYPED_PAGE.test(location.pathname)) setTeamsMode(false);
};

const findSearchRoot = () =>
  siteSearch
    ? (document.querySelector(SEARCH_INPUT)?.closest('[cmdk-root]') ??
      undefined)
    : undefined;

/** The site search's results, the last of its lists (history comes first). */
const findResults = () => {
  const lists =
    findSearchRoot()?.querySelectorAll<HTMLElement>('[cmdk-list-sizer]');
  return lists?.[lists.length - 1];
};

/** The type toggle of the site search. */
const findToggle = () =>
  findSearchRoot()?.querySelector<HTMLElement>(
    '[cmdk-input-wrapper] [aria-haspopup]',
  ) ?? undefined;

/** The toggle's "Спільнота" group, while its popover is open. */
const findTypeGroup = () =>
  findSearchRoot()
    ? (document
        .querySelector('[cmdk-item][data-value="user"]')
        ?.closest<HTMLElement>('[cmdk-group-items]') ?? undefined)
    : undefined;

const PAGE_STYLE = `
  /* The site's "nothing found" and "type to search" lines, while teams are found. */
  [cmdk-list-sizer]:has([${OWN_ITEM}]) > div:not([cmdk-group]):has(> p) {
    display: none;
  }
  /* In "Команди", the site's results under the type it still has, and its label. */
  [cmdk-root][${TEAMS_MODE}="results"] [cmdk-list-sizer] > :not(team-search),
  [cmdk-root][${TEAMS_MODE}="results"] [cmdk-input-wrapper] [aria-haspopup] > span {
    display: none !important;
  }
  /* ...and its tick in the toggle. */
  [cmdk-root][${TEAMS_MODE}="toggle"] [cmdk-item]:not([${OWN_ITEM}]) [data-slot="checkbox"] {
    background-color: transparent !important;
  }
  [cmdk-root][${TEAMS_MODE}="toggle"] [cmdk-item]:not([${OWN_ITEM}]) [data-slot="checkbox-indicator"] {
    display: none !important;
  }
`;

const byRelevance = (query: string) => {
  const key = looseKey(query);
  const starts = (team: TeamListing) => looseKey(team.title).startsWith(key);
  return (a: TeamListing, b: TeamListing) =>
    Number(starts(b)) - Number(starts(a)) ||
    (b.stats?.anime ?? 0) - (a.stats?.anime ?? 0);
};

/** What the group reads off the site's search, as one comparable string. */
const readSearch = (root: Element, list: Element) =>
  JSON.stringify([
    root.querySelector<HTMLInputElement>('[cmdk-input]')?.value ?? '',
    root
      .querySelector('[cmdk-input-wrapper] [aria-haspopup] > span')
      ?.textContent?.trim() ?? '',
    // One of the site's items is selected: none of ours is.
    !!list.querySelector(
      `[cmdk-item][aria-selected="true"]:not([${OWN_ITEM}])`,
    ),
    !!list.querySelector(`${ITEMS}:not([${OWN_ITEM}])`),
  ]);

const useSearchState = (list: HTMLElement) => {
  const root = list.closest<HTMLElement>('[cmdk-root]')!;
  const snapshot = useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(root, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['aria-selected'],
      });
      root.addEventListener('input', onChange);
      return () => {
        observer.disconnect();
        root.removeEventListener('input', onChange);
      };
    },
    () => readSearch(root, list),
  );
  const [query, type, siteSelected, siteItems] = JSON.parse(snapshot) as [
    string,
    string,
    boolean,
    boolean,
  ];
  return { root, query: query.trim(), type, siteSelected, siteItems };
};

/**
 * Makes `item` cmdk's selected item. cmdk keeps the selection by value and
 * finds items in the DOM, so with every item above `item` disabled for the
 * moment, its Home key selects `item`. Our items aren't cmdk's own, so
 * nothing else would tell it about them.
 */
function selectItem(root: Element, item: Element) {
  const items = [...root.querySelectorAll(ITEMS)];
  const above = items.slice(0, items.indexOf(item));
  for (const other of above) other.setAttribute('aria-disabled', 'true');
  root.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
  );
  for (const other of above) other.setAttribute('aria-disabled', 'false');
}

/** Where cmdk's arrow keys and shortcuts move the selection, or undefined. */
function keyTarget(event: KeyboardEvent, items: Element[], current: number) {
  const vim = event.ctrlKey && !event.altKey && !event.metaKey;
  const down = event.key === 'ArrowDown' || (vim && /^[nj]$/.test(event.key));
  const up = event.key === 'ArrowUp' || (vim && /^[pk]$/.test(event.key));
  if (event.key === 'Home' || (up && event.metaKey)) return 0;
  if (event.key === 'End' || (down && event.metaKey)) return items.length - 1;
  if (!down && !up) return undefined;
  if (event.altKey) {
    // To the first item of the next or previous group.
    const groups = items.map((item) => item.closest('[cmdk-group]'));
    const own = groups[current];
    const next = down
      ? groups.findIndex((group, index) => index > current && group !== own)
      : groups.findLastIndex(
          (group, index) => index < current && group !== own,
        );
    if (next !== -1) return groups.indexOf(groups[next]!);
  }
  return current + (down ? 1 : -1);
}

/**
 * Lets cmdk's keys reach our items in `root`: moves between the site's
 * items stay cmdk's own, any that involve ours are made here. With `alone`,
 * only ours are moved through (the site's are hidden).
 */
function useOwnItemKeys(
  root: HTMLElement,
  enabled: boolean,
  alone: boolean,
  onMove?: (item: Element) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.isTrusted || event.defaultPrevented || event.isComposing) {
        return;
      }
      const list = root.querySelectorAll('[cmdk-list-sizer]');
      const items = [...(list[list.length - 1]?.querySelectorAll(ITEMS) ?? [])];
      const all = alone ? items.filter(isOwn) : items;
      const current = all.findIndex(isSelected);
      const index = keyTarget(event, all, current);
      if (index === undefined) return;
      const target = all[index];
      if (!alone && (!target || (!isOwn(target) && !isOwn(all[current])))) {
        return;
      }
      event.preventDefault();
      if (!target) return;
      onMove?.(target);
      selectItem(root, target);
      target.scrollIntoView({ block: 'nearest' });
    };
    root.addEventListener('keydown', onKeyDown, true);
    return () => root.removeEventListener('keydown', onKeyDown, true);
  }, [root, enabled, alone, onMove]);
}

const closeSearch = (root: Element) =>
  root.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );

const openPath = (root: Element, path: string) => {
  closeSearch(root);
  navigateOnHikka(path);
};

/** A plain click opens a link in place; others are left to the browser. */
const onLinkClick = (event: MouseEvent, root: Element, path: string) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  openPath(root, path);
};

interface ItemProps {
  root: Element;
  choose: (item: Element) => void;
  value: string;
  path: string;
  selected: boolean;
  className: string;
  children: ReactNode;
}

/** One of our items, laid out as cmdk's and moved to by its keys. */
const Item: FC<ItemProps> = ({
  root,
  choose,
  value,
  path,
  selected,
  className,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // cmdk's Enter dispatches this on the selected item.
    const item = ref.current!;
    const open = () => openPath(root, path);
    item.addEventListener('cmdk-item-select', open);
    return () => item.removeEventListener('cmdk-item-select', open);
  }, [root, path]);

  return (
    <div
      ref={ref}
      {...{ [OWN_ITEM]: '' }}
      cmdk-item=""
      role="option"
      data-value={value}
      aria-selected={selected}
      data-selected={selected}
      aria-disabled={false}
      data-disabled={false}
      onPointerMove={(event: PointerEvent) =>
        !selected && choose(event.currentTarget)
      }
      onClick={(event) => onLinkClick(event, root, path)}
      className={className}
    >
      {children}
    </div>
  );
};

const TeamCard: FC<{ team: TeamListing; path: string }> = ({ team, path }) => {
  const count = team.stats?.anime ?? 0;
  return (
    // The item opens it, also from the keyboard; the link is for other clicks.
    <a
      href={path}
      tabIndex={-1}
      className="flex w-full items-center gap-4 text-left"
    >
      <div className="bg-secondary/40 text-muted-foreground flex aspect-square w-12 shrink-0 items-center justify-center overflow-hidden rounded-(--base-radius) font-medium">
        {team.logo ? (
          <img
            src={team.logo}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          team.title.match(/\p{L}|\p{N}/u)?.[0]?.toUpperCase()
        )}
      </div>
      <div className="flex w-full flex-1 flex-col gap-2">
        <label className="line-clamp-2 text-sm leading-tight font-bold">
          {team.title}
        </label>
        <div className="flex items-center gap-2">
          {[...team.kinds, `${count} аніме`].map((part, index) => (
            <Fragment key={part}>
              {index > 0 && (
                <div className="bg-muted-foreground size-1 rounded-full" />
              )}
              <label className="text-muted-foreground text-xs font-medium">
                {part}
              </label>
            </Fragment>
          ))}
        </div>
      </div>
    </a>
  );
};

/**
 * The "Команди" group among the site search's results, or in the "Команди"
 * type, the results themselves.
 */
const TeamResults: FC<{ list: HTMLElement }> = ({ list }) => {
  const { root, query, type, siteSelected, siteItems } = useSearchState(list);
  const deferredQuery = useDeferredValue(query);
  const alone = useTeamsMode();
  const active =
    alone || (type === ALL_TYPES && deferredQuery.length >= MIN_QUERY);
  const limit = alone ? SHOWN_ALONE : SHOWN;

  useEffect(() => {
    if (!alone) return;
    root.setAttribute(TEAMS_MODE, 'results');
    return () => root.removeAttribute(TEAMS_MODE);
  }, [root, alone]);

  const { data } = useQuery({
    queryKey: ['team-list'],
    queryFn: () => convex.query(convexApi.fandub.teams, {}),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const matches = useMemo(
    () =>
      active
        ? (data ?? [])
            .filter(
              (team) =>
                (team.stats?.anime ?? 0) > 0 &&
                matchesName(team.title, deferredQuery),
            )
            // With no query yet, the busiest teams first.
            .toSorted(byRelevance(deferredQuery))
        : [],
    [data, active, deferredQuery],
  );
  const shown = matches.slice(0, limit);
  const allPath = deferredQuery
    ? `${teamPagePath()}?${new URLSearchParams({ [TEAM_SEARCH_PARAM]: deferredQuery })}`
    : teamPagePath();
  const items = [
    ...shown.map((team) => ({
      value: `hikka-features-team-${team.slug}`,
      path: teamPagePath(team.slug),
      team,
    })),
    ...(matches.length > limit
      ? [
          {
            value: 'hikka-features-view-all-teams',
            path: allPath,
            team: undefined,
          },
        ]
      : []),
  ];

  // cmdk selects by value; the one of ours it was last told to for this
  // query. The site's own selection shows only after its next render.
  const [chosen, setChosen] = useState<string>();
  const [chosenFor, setChosenFor] = useState(query);
  if (query !== chosenFor) {
    setChosenFor(query);
    setChosen(undefined);
  }
  // With none of the site's selected, cmdk's selection is one of ours: the
  // chosen one, or the first, which it picks while it has nothing else.
  // Alone, the site's are hidden, and the selection always ours.
  const selected =
    siteSelected && !alone
      ? undefined
      : (items.find((item) => item.value === chosen) ?? items[0])?.value;
  const onMove = (item: Element) => {
    if (isOwn(item)) setChosen(item.getAttribute('data-value')!);
  };
  const choose = (item: Element) => {
    onMove(item);
    selectItem(root, item);
  };

  useEffect(() => {
    if (!items.length) return;
    if (alone) {
      // cmdk picked one of the site's hidden items; it is ours to pick.
      if (!siteSelected) return;
      const own = list.querySelector(
        `[${OWN_ITEM}][data-value="${CSS.escape(selected!)}"]`,
      );
      if (own) selectItem(root, own);
      return;
    }
    // Teams cmdk picked by itself, coming before the site's results, give
    // the selection back to the site's first result once it is there.
    if (siteSelected || chosen || !siteItems) return;
    const first = list.querySelector(`${ITEMS}:not([${OWN_ITEM}])`);
    if (first) selectItem(root, first);
  });

  // Teams follow the first group of results (anime, unless it found none),
  // in sight without scrolling; the site adds a group per type as their
  // results come. Alone, they lead, first for cmdk's keys too.
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = wrapper.current?.parentElement;
    if (!host) return;
    const place = () => {
      if (host.parentElement !== list) return;
      if (alone) {
        if (list.firstElementChild !== host) list.prepend(host);
        return;
      }
      const first = [...list.children].find(
        (child) => child !== host && child.hasAttribute('cmdk-group'),
      );
      if (first && first.nextElementSibling !== host) first.after(host);
    };
    place();
    const observer = new MutationObserver(place);
    observer.observe(list, { childList: true });
    return () => observer.disconnect();
  }, [list, alone]);

  useOwnItemKeys(root, items.length > 0, alone, onMove);

  if (!items.length) {
    return alone && data ? (
      // The site's own line for an empty result (`search-placeholders.tsx`).
      <div ref={wrapper} className="flex items-center justify-center py-6">
        <p className="text-muted-foreground text-center text-sm">
          За Вашим запитом нічого не знайдено
        </p>
      </div>
    ) : (
      <div ref={wrapper} hidden />
    );
  }

  return (
    <div
      ref={wrapper}
      cmdk-group=""
      role="presentation"
      data-value="hikka-features-teams"
      className={GROUP}
    >
      {/* The site's single-type results have no heading either. */}
      {!alone && (
        <div
          cmdk-group-heading=""
          aria-hidden
          id="hikka-features-teams-heading"
        >
          {TEAMS_LABEL}
        </div>
      )}
      <div
        cmdk-group-items=""
        role="group"
        aria-labelledby={alone ? undefined : 'hikka-features-teams-heading'}
      >
        {items.map(({ value, path, team }) => (
          <Item
            key={value}
            root={root}
            choose={choose}
            value={value}
            path={path}
            selected={selected === value}
            className={team ? ITEM : `${ITEM} ${FOOTER}`}
          >
            {team ? (
              <TeamCard team={team} path={path} />
            ) : (
              <>
                <Ellipsis />
                Показати всі результати
              </>
            )}
          </Item>
        ))}
      </div>
    </div>
  );
};

/** The site's class strings for an option of the type toggle. */
const TYPE_OPTION =
  "relative flex cursor-pointer select-none items-center p-2! text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected='true']:bg-muted data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2 rounded-(--base-radius)";
const CHECKBOX =
  'peer grid size-4 shrink-0 place-content-center rounded-sm border ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-checked:bg-primary data-checked:text-primary-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 border-border';

const TypeLabel = () => (
  <span className="flex items-center gap-2">
    <MaterialSymbolsGroupsRounded className="size-4!" />
    <span>{TEAMS_LABEL}</span>
  </span>
);

/** The toggle's label for "Команди", in place of the site type's it hides. */
const ToggleLabel = () =>
  useTeamsMode() ? (
    <span className="pointer-events-none min-w-0 flex-1 truncate">
      <TypeLabel />
    </span>
  ) : null;

/** Closes the toggle's popover, as picking one of its own types does. */
const closeToggle = () => {
  findToggle()?.click();
  findSearchRoot()?.querySelector<HTMLElement>('[cmdk-input]')?.focus();
};

/** "Команди", the last of the toggle's types, under "Спільнота". */
const TypeOption: FC<{ group: HTMLElement }> = ({ group }) => {
  const root = group.closest<HTMLElement>('[cmdk-root]')!;
  const checked = useTeamsMode();
  const siteSelected = useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(root, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-selected'],
      });
      return () => observer.disconnect();
    },
    () =>
      !!root.querySelector(
        `[cmdk-item][aria-selected="true"]:not([${OWN_ITEM}])`,
      ),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checked) return;
    root.setAttribute(TEAMS_MODE, 'toggle');
    return () => root.removeAttribute(TEAMS_MODE);
  }, [root, checked]);

  useEffect(() => {
    const item = ref.current!;
    // The toggle opens on the current type.
    if (teamsMode) selectItem(root, item);
    const pick = () => {
      setTeamsMode(true);
      closeToggle();
    };
    // Picking one of the site's types leaves "Команди".
    const leave = (event: Event) => {
      const picked =
        event.target instanceof Element && event.target.closest('[cmdk-item]');
      if (!picked || isOwn(picked)) return;
      // The site ignores a pick of the type it already has, shown unticked.
      const unchanged =
        teamsMode &&
        !!picked.querySelector('[data-slot="checkbox"][data-checked]');
      setTeamsMode(false);
      if (unchanged) queueMicrotask(closeToggle);
    };
    item.addEventListener('cmdk-item-select', pick);
    root.addEventListener('click', leave, true);
    root.addEventListener('cmdk-item-select', leave, true);
    return () => {
      item.removeEventListener('cmdk-item-select', pick);
      root.removeEventListener('click', leave, true);
      root.removeEventListener('cmdk-item-select', leave, true);
    };
  }, [root]);

  useOwnItemKeys(root, true, false);

  return (
    <div
      ref={ref}
      {...{ [OWN_ITEM]: '' }}
      cmdk-item=""
      role="option"
      data-value="hikka-features-teams"
      aria-selected={!siteSelected}
      data-selected={!siteSelected}
      aria-disabled={false}
      data-disabled={false}
      onPointerMove={(event) =>
        siteSelected && selectItem(root, event.currentTarget)
      }
      onClick={() => {
        setTeamsMode(true);
        closeToggle();
      }}
      className={TYPE_OPTION}
    >
      <span
        role="checkbox"
        aria-checked={checked}
        data-slot="checkbox"
        {...(checked ? { 'data-checked': '' } : { 'data-unchecked': '' })}
        className={CHECKBOX}
      >
        {checked && (
          <span
            data-checked=""
            data-slot="checkbox-indicator"
            className="grid place-content-center text-current"
          >
            <Check className="size-4!" aria-hidden />
          </span>
        )}
      </span>
      <span className="truncate">
        <TypeLabel />
      </span>
    </div>
  );
};

/**
 * Teams in hikka.io's search: a "Команди" group of the teams whose names
 * match, opening their pages, and a "Команди" type that lists only teams.
 */
export default class TeamSearchFeature extends AnchoredUisFeature {
  readonly id = 'team-search';
  readonly pages = [HikkaPages.All];

  async init() {
    const { ctx } = usePageStore.getState();
    const style = document.createElement('style');
    style.textContent = PAGE_STYLE;
    document.head.append(style);
    document.addEventListener('pointerdown', followSearchOpener, true);
    document.addEventListener('keydown', followSearchOpener, true);
    ctx.onInvalidated(() => {
      style.remove();
      document.removeEventListener('pointerdown', followSearchOpener, true);
      document.removeEventListener('keydown', followSearchOpener, true);
    });
    this.integrate([
      { find: findResults, render: (list) => <TeamResults list={list} /> },
      { find: findToggle, render: () => <ToggleLabel />, append: 'first' },
      { find: findTypeGroup, render: (group) => <TypeOption group={group} /> },
    ]);
  }
}
