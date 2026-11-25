import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
} from 'motion/react';
import {
  type FocusEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { notify, useNotifications } from '@/utils/notify';

import { NotificationCard } from './notification-card';

/** Notifications laid out at once; the rest wait for these to go. */
const MAX_SHOWN = 4;
/** Cards whose edges show behind the front one while collapsed. */
const COLLAPSED_DEPTH = 3;
/** How far each covered card peeks out, and the gap once expanded. */
const PEEK = 10;
const GAP = 8;
const FOOTER_HEIGHT = 28;

const SPRING: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
};

const useDocumentHidden = () =>
  useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'hidden',
  );

/**
 * The notifications, stacked in a corner: newest in front with the others'
 * edges behind it, spread out while hovered, focused or tapped. Their
 * timers wait meanwhile, and while the tab is hidden.
 */
export const NotificationStack = () => {
  const notifications = useNotifications((state) => state.notifications);
  const isMobile = useIsMobile();
  const hidden = useDocumentHidden();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const listRef = useRef<HTMLOListElement>(null);

  // On phones they come from the top, clear of the site's and player's bars.
  const side = isMobile ? 'top' : 'bottom';
  // Which way covered cards and the spread-out ones go from the front one.
  const away = side === 'bottom' ? -1 : 1;

  const shown = notifications.slice(0, MAX_SHOWN);
  const waiting = notifications.length - shown.length;
  const expanded = (hovered || focused || tapped) && shown.length > 0;
  const paused = expanded || hidden;

  const onHeight = useCallback((id: string, height: number) => {
    setHeights((current) => {
      if (current[id] === height) return current;
      // Drops the heights of notifications that are gone meanwhile.
      const ids = new Set(
        useNotifications.getState().notifications.map((item) => item.id),
      );
      return Object.fromEntries([
        ...Object.entries(current).filter(([key]) => ids.has(key)),
        [id, height],
      ]);
    });
  }, []);

  // Nothing left to hover or tap: the next one starts collapsed.
  if (shown.length === 0 && (hovered || tapped)) {
    setHovered(false);
    setTapped(false);
  }

  // A tap spreads them out until one lands outside.
  useEffect(() => {
    if (!tapped) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!listRef.current || !event.composedPath().includes(listRef.current))
        setTapped(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, true);
  }, [tapped]);

  // Alt+N moves focus to the newest notification, for the keyboard.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code !== 'KeyN') return;
      const card =
        listRef.current?.querySelector<HTMLElement>('[tabindex="-1"]');
      if (!card) return;
      event.preventDefault();
      card.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const heightOf = (id: string) => heights[id] ?? 0;
  const frontHeight = shown[0] ? heightOf(shown[0].id) : 0;

  // Where each card starts from the stack's edge once spread out.
  const offsets: number[] = [];
  let spread = 0;
  for (const { id } of shown) {
    offsets.push(spread);
    spread += heightOf(id) + GAP;
  }

  const dismissible = notifications.filter(
    (item) => item.dismissible !== false,
  );
  const footer = expanded && (dismissible.length > 1 || waiting > 0);
  const listHeight = expanded
    ? spread - GAP + (footer ? FOOTER_HEIGHT + GAP : 0)
    : frontHeight + Math.min(shown.length - 1, COLLAPSED_DEPTH - 1) * PEEK;

  const onBlur = (event: FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
      setFocused(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="Сповіщення (Alt+N)"
        className="pointer-events-none fixed z-2147483647 flex flex-col"
        style={
          side === 'bottom'
            ? {
                right: 16,
                bottom: 16,
                width: 360,
                maxWidth: 'calc(100vw - 32px)',
              }
            : {
                left: 8,
                right: 8,
                top: 'max(8px, env(safe-area-inset-top))',
              }
        }
      >
        <motion.ol
          ref={listRef}
          initial={false}
          animate={{ height: Math.max(listHeight, 0) }}
          transition={SPRING}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') setHovered(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') setHovered(false);
          }}
          onPointerUp={(event) => {
            if (event.pointerType !== 'mouse' && shown.length > 1)
              setTapped(true);
          }}
          onFocus={() => setFocused(true)}
          onBlur={onBlur}
          className={cn(
            'relative m-0 list-none p-0',
            shown.length > 0 && 'pointer-events-auto',
          )}
        >
          <AnimatePresence initial={false}>
            {shown.map((notification, index) => {
              const covered = !expanded && index > 0;
              const height = heights[notification.id];
              return (
                <motion.li
                  key={notification.id}
                  initial={{ opacity: 0, y: -away * 48, scale: 0.9 }}
                  animate={
                    expanded
                      ? {
                          opacity: 1,
                          y: away * offsets[index]!,
                          scale: 1,
                          height: height ?? 'auto',
                        }
                      : {
                          opacity: index < COLLAPSED_DEPTH ? 1 : 0,
                          y: away * index * PEEK,
                          scale: 1 - index * 0.05,
                          // Covered cards take the front one's size.
                          height:
                            (index === 0 ? height : frontHeight || height) ??
                            'auto',
                        }
                  }
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    transition: { duration: 0.18, ease: 'easeIn' },
                  }}
                  transition={SPRING}
                  style={{
                    zIndex: shown.length - index,
                    [side]: 0,
                    transformOrigin: side === 'bottom' ? 'top' : 'bottom',
                  }}
                  className="bg-popover/85 text-popover-foreground ring-foreground/10 absolute inset-x-0 overflow-hidden rounded-xl shadow-[0_8px_30px_-6px_rgb(0_0_0/0.35)] ring-1 backdrop-blur-xl backdrop-saturate-150"
                >
                  <NotificationCard
                    notification={notification}
                    covered={covered}
                    paused={paused}
                    onHeight={onHeight}
                  />
                </motion.li>
              );
            })}
          </AnimatePresence>

          <AnimatePresence>
            {footer && (
              <motion.li
                key="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: away * spread }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={SPRING}
                style={{ [side]: 0, height: FOOTER_HEIGHT }}
                className="absolute inset-x-0 flex items-center justify-between gap-2 px-1"
              >
                {waiting > 0 && (
                  <span className="text-muted-foreground bg-popover/70 rounded-full px-2.5 py-1 text-xs backdrop-blur-xl">
                    Ще {waiting} в черзі
                  </span>
                )}
                {dismissible.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      for (const item of dismissible)
                        notify.dismiss(item.id, 'user');
                    }}
                    className="bg-popover/85 text-popover-foreground ring-foreground/10 hover:bg-accent focus-visible:ring-ring ml-auto rounded-full px-3 py-1 text-xs font-medium ring-1 backdrop-blur-xl outline-none focus-visible:ring-2"
                  >
                    Закрити всі
                  </button>
                )}
              </motion.li>
            )}
          </AnimatePresence>
        </motion.ol>
      </section>
    </MotionConfig>
  );
};
