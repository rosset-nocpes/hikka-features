import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bug, Crosshair, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { hikkaViewerQuery } from '@/utils/hikka-viewer';

import { BaseFeature, createFeatureUi } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

const ID = 'dev-inspector';

/**
 * A corner panel on every page for working on the extension: its UIs on the
 * page, how it reads the route, who is signed in where, and a refetch of
 * everything it loaded.
 */
export default class DevInspectorFeature extends BaseFeature {
  readonly id = ID;
  readonly pages = [HikkaPages.All];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      anchor: 'body',
      append: 'last',
      render: () => <DevInspector />,
    });
  }
}

/**
 * The extension's UIs on the page: every feature's root is an element named
 * after it, which hikka.io's own elements never are.
 */
const findHosts = () =>
  [...document.body.querySelectorAll('*')].filter(
    (element) => element.localName.includes('-') && element.localName !== ID,
  );

const MARK = 'data-hf-dev-outline';
/** On marked elements that were static, which the label needs positioned. */
const STATIC_MARK = 'data-hf-dev-static';
const STYLE_MARK = 'data-hf-dev-outline-style';

/**
 * Drawn by the marked elements themselves, so the outlines stay on them
 * while the page scrolls, sticks or animates. Overrides any `::after` of
 * theirs while it's on.
 */
const OUTLINE_CSS = `
[${MARK}] {
  outline: 2px dashed #ec4899 !important;
  outline-offset: -2px !important;
}
[${STATIC_MARK}] { position: relative !important; }
[${MARK}]::after {
  content: attr(${MARK}) !important;
  position: absolute !important;
  inset: 0 auto auto 0 !important;
  z-index: 2147483647 !important;
  width: auto !important;
  height: auto !important;
  padding: 0 4px !important;
  border-radius: 0 0 2px 0 !important;
  background: #ec4899 !important;
  color: #fff !important;
  font: 10px/16px ui-monospace, monospace !important;
  opacity: 1 !important;
  transform: none !important;
  pointer-events: none !important;
}
`;

const hasBox = (element: Element) => {
  const box = element.getBoundingClientRect();
  return (
    box.width > 0 &&
    box.height > 0 &&
    getComputedStyle(element).display !== 'contents'
  );
};

/**
 * The elements that show `host`: itself, or else the shallowest of its
 * descendants with a box, e.g. under a `display: contents` or 0×0 root.
 */
const drawnElements = (host: Element) => {
  let level = [host];
  while (level.length) {
    const drawn = level.filter(hasBox);
    if (drawn.length) return drawn;
    level = level.flatMap((element) => [
      ...(element.shadowRoot?.children ?? element.children),
    ]);
  }
  return [];
};

/** Adds the outline styles to the document or shadow root `element` is in. */
const styleRootOf = (element: Element) => {
  const root = element.getRootNode();
  const parent = root instanceof ShadowRoot ? root : document.head;
  if (parent.querySelector(`style[${STYLE_MARK}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(STYLE_MARK, '');
  style.textContent = OUTLINE_CSS;
  parent.append(style);
};

/** Outlines and labels `hosts` until the returned function is called. */
const outline = (hosts: Element[]) => {
  const marked = hosts.flatMap((host) =>
    drawnElements(host).map((element) => {
      styleRootOf(element);
      if (getComputedStyle(element).position === 'static') {
        element.setAttribute(STATIC_MARK, '');
      }
      element.setAttribute(MARK, host.localName);
      return element;
    }),
  );
  return () => {
    for (const element of marked) {
      element.removeAttribute(MARK);
      element.removeAttribute(STATIC_MARK);
    }
  };
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="truncate font-mono" title={value}>
      {value}
    </span>
  </div>
);

const DevInspector = () => {
  const { devTools } = useSettings().features.devOptions;
  const username = useSettings((state) =>
    state.convexSession ? state.userData?.username : undefined,
  );
  const { path, contentType, slug } = usePageStore();
  const queryClient = useQueryClient();
  const fetching = useIsFetching() > 0;
  const viewer = useQuery({ ...hikkaViewerQuery, enabled: devTools });
  const [open, setOpen] = useState(false);
  const [outlineAll, setOutlineAll] = useState(false);
  const [hovered, setHovered] = useState<Element>();
  const [hosts, setHosts] = useState<Element[]>([]);

  // The page changes as it renders, so look again while it matters.
  const watching = devTools && (open || outlineAll);
  useEffect(() => {
    if (!watching) return;
    const scan = () => setHosts(findHosts());
    scan();
    const interval = setInterval(scan, 1000);
    return () => clearInterval(interval);
  }, [watching, path]);

  // Marked again with each scan, as the UIs re-render their elements.
  useEffect(() => {
    if (!devTools) return;
    const highlighted = outlineAll ? hosts : hovered ? [hovered] : [];
    return outline(highlighted.filter((host) => host.isConnected));
  }, [devTools, outlineAll, hosts, hovered]);

  if (!devTools) return null;

  const viewerText = viewer.isError
    ? 'помилка'
    : viewer.data === undefined
      ? '…'
      : (viewer.data ?? 'гість');

  return (
    <div className="fixed bottom-[calc(var(--tab-bar-height,0px)+5rem)] left-4 z-50 flex flex-col items-start gap-2 text-sm sm:bottom-[calc(var(--tab-bar-height,0px)+1rem)]">
      {/* Above the page's bottom bar on phones, which spans the screen. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="surface-glass border-border flex max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] origin-bottom-left flex-col gap-4 overflow-y-auto rounded-lg border p-4"
          >
            <section className="flex flex-col gap-1.5">
              <h2 className="font-semibold">Сторінка</h2>
              <Row label="Шлях" value={`/${path?.join('/') ?? ''}`} />
              <Row label="Тип" value={contentType ?? '—'} />
              <Row label="Slug" value={slug ?? '—'} />
            </section>
            <section className="flex flex-col gap-1.5">
              <h2 className="font-semibold">Вхід</h2>
              <Row label="hikka.io" value={viewerText} />
              <Row label="Розширення" value={username ?? 'не увійшли'} />
            </section>
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">
                  UI розширення{' '}
                  <span className="text-muted-foreground">{hosts.length}</span>
                </h2>
                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                  Підсвітити всі
                  <Switch
                    checked={outlineAll}
                    onCheckedChange={setOutlineAll}
                  />
                </label>
              </div>
              <ul className="-mx-2 flex flex-col">
                {hosts.map((host, index) => {
                  const empty = !drawnElements(host).length;
                  return (
                    <li key={index}>
                      <button
                        type="button"
                        disabled={empty}
                        className="hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left font-mono text-xs transition-[background-color] disabled:opacity-50"
                        onPointerEnter={() => setHovered(host)}
                        onPointerLeave={() => setHovered(undefined)}
                        onClick={() =>
                          host.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          })
                        }
                      >
                        <span className="truncate">{host.localName}</span>
                        {empty ? (
                          <span className="text-muted-foreground font-sans">
                            порожній
                          </span>
                        ) : (
                          <Crosshair className="text-muted-foreground size-3.5" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="surface-glass border-border flex items-center rounded-lg border p-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={open ? 'Закрити інспектор' : 'Інспектор розширення'}
          title="Інспектор розширення"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
            setHovered(undefined);
          }}
        >
          {open ? <X /> : <Bug />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Оновити дані розширення"
          title="Оновити дані розширення"
          disabled={fetching}
          onClick={() => void queryClient.invalidateQueries()}
        >
          <RefreshCw className={cn(fetching && 'animate-spin')} />
        </Button>
      </div>
    </div>
  );
};
