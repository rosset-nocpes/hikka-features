/** What the block is called on the page, in the layout dialog and as a tab. */
export const BLOCK_TITLE = 'Друзі дивляться';

export type Side = 'left' | 'center' | 'right';

/**
 * hikka.io's homepage widgets by the slug its layout uses: the id of the
 * element each renders, and its name in the layout dialog.
 */
export const SITE_WIDGETS: Record<string, { id: string; title: string }> = {
  profile: { id: 'sidebar-profile', title: 'Профіль' },
  list: { id: 'sidebar-list-stats', title: 'Список' },
  ongoings: { id: 'ongoings', title: 'Онґоїнґи' },
  tracker: { id: 'tracker', title: 'Дивлюсь/читаю' },
  history: { id: 'history', title: 'Активність' },
  schedule: { id: 'calendar', title: 'Календар' },
  feed: { id: 'feed-widget', title: 'Стрічка' },
  collections: { id: 'collections', title: 'Колекції' },
  articles: { id: 'articles', title: 'Статті' },
};

export const slugByTitle = (title: string | null | undefined) =>
  Object.entries(SITE_WIDGETS).find(
    ([, widget]) => widget.title === title?.trim(),
  )?.[0];

/** Where the site moves a widget whose column the layout doesn't have. */
const SIDE_FALLBACK: Record<Side, Side[]> = {
  left: ['right', 'center'],
  center: ['right', 'left'],
  right: ['center', 'left'],
};

export const resolveSide = (side: Side, sides: Side[]) =>
  sides.includes(side)
    ? side
    : (SIDE_FALLBACK[side].find((fallback) => sides.includes(fallback)) ??
      sides[0]);

/** Laid out, i.e. not inside something with `display: none`. */
export const isShown = (element: Element | null | undefined) =>
  !!element && element.getClientRects().length > 0;

type Shape = [tag: 'path' | 'circle', attributes: Record<string, string>];

const dot = (cx: number, cy: number): Shape => [
  'circle',
  { cx: String(cx), cy: String(cy), r: '1' },
];

/** Lucide outlines, as the site's own widgets use. */
const ICONS = {
  users: [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['circle', { cx: '9', cy: '7', r: '4' }],
    ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
    ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
  ],
  grip: [
    dot(9, 12),
    dot(9, 5),
    dot(9, 19),
    dot(15, 12),
    dot(15, 5),
    dot(15, 19),
  ],
  x: [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ],
  plus: [
    ['path', { d: 'M5 12h14' }],
    ['path', { d: 'M12 5v14' }],
  ],
} satisfies Record<string, Shape[]>;

const SVG = 'http://www.w3.org/2000/svg';

export function icon(name: keyof typeof ICONS, className: string) {
  const svg = document.createElementNS(SVG, 'svg');
  for (const [key, value] of Object.entries({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    class: className,
  })) {
    svg.setAttribute(key, value);
  }
  for (const [tag, attributes] of ICONS[name] as Shape[]) {
    const shape = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attributes)) {
      shape.setAttribute(key, value);
    }
    svg.append(shape);
  }
  return svg;
}

/** The extension's mark, to tell its block from the site's own. */
export function logo(className: string) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 21 20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-label', 'Hikka Features');
  svg.setAttribute('class', className);
  const paths: [d: string, fill: string][] = [
    [
      'M4.7144 4.38911L2 7.11024L4.91029 9.99967L2 13.0013L4.74239 15.6663L7.65267 12.7769L10.535 15.6663L13.2774 12.9452L10.3391 10.0558L13.3333 7.11024L10.535 4.33301L7.65267 7.3066L4.7144 4.38911Z',
      '#BF4147',
    ],
    [
      'M14.1927 12.8525V12.2673H18.164V9.55991H14.1927V7.25939L11.3494 10.0565L14.1927 12.8525Z',
      'currentColor',
    ],
    ['M11.5406 15.6673H14.1927V13.0358L11.5406 15.6673Z', 'currentColor'],
    [
      'M14.3413 7.11323L11.5409 4.33398H19.0001V7.23028H14.2223L14.3413 7.11323Z',
      'currentColor',
    ],
  ];
  for (const [d, fill] of paths) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    svg.append(path);
  }
  return svg;
}
