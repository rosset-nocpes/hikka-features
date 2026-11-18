import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

import {
  type CornerStore,
  FLOATING_DURATION_MS,
  FLOATING_EASE,
  reducedMotion,
  useFloatingCard,
} from '@/hooks/use-floating-card';

import { usePlayer } from './context/player-context';

/** `bar` is the strip shown while the browser's picture-in-picture plays. */
type PlayerLayout = 'full' | 'mini' | 'bar';

export const layoutOf = (state: {
  miniPlayer: boolean;
  videoPiPActive: boolean;
}): PlayerLayout =>
  state.miniPlayer ? 'mini' : state.videoPiPActive ? 'bar' : 'full';

const cornerStore: CornerStore = {
  get: () => usePlayer.getState().miniPlayerCorner,
  set: (corner) => usePlayer.getState().setMiniPlayerCorner(corner),
};

/**
 * Keeps the floating player in its corner and lets it be dragged to another
 * (see `useFloatingCard`). Returns the `pointerdown` handler for handles.
 */
export const useMiniPlayerDrag = (
  cardRef: RefObject<HTMLElement | null>,
  layout: PlayerLayout,
) =>
  useFloatingCard(cardRef, {
    floating: layout !== 'full',
    corner: cornerStore,
    // Nearest its corner: other floating cards make way for the video.
    order: 0,
    layoutKey: layout,
  });

/**
 * Animates the card between the full and mini layouts: it is measured before
 * and after the switch, and the difference is played back as a transform
 * (FLIP), so the switch itself costs one layout. The bar has another shape,
 * so it slides in and out instead.
 */
export const useLayoutTransition = (
  cardRef: RefObject<HTMLElement | null>,
  layout: PlayerLayout,
) => {
  const from = useRef<{ rect: DOMRect; layout: PlayerLayout }>(undefined);

  // Store listeners run before React re-renders, while the old layout is up.
  useEffect(
    () =>
      usePlayer.subscribe((state, previous) => {
        const card = cardRef.current;
        if (card && layoutOf(state) !== layoutOf(previous)) {
          from.current = {
            rect: card.getBoundingClientRect(),
            layout: layoutOf(previous),
          };
        }
      }),
    [cardRef],
  );

  useLayoutEffect(() => {
    const card = cardRef.current;
    const first = from.current;
    from.current = undefined;
    if (!card || !first || first.layout === layout) return;
    // No movement: the new layout fades in where it lands.
    if (reducedMotion()) {
      card.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 150,
        easing: 'ease-out',
      });
      return;
    }

    // Measured after every layout effect of this commit (the frame's scroll
    // lock can still move the page), but before the browser paints.
    queueMicrotask(() => {
      const last = card.getBoundingClientRect();
      if (!last.width || !last.height) return;

      const options = { duration: FLOATING_DURATION_MS, easing: FLOATING_EASE };
      if (first.layout === 'bar' || layout === 'bar') {
        card.animate(
          [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1 }],
          options,
        );
        return;
      }

      const { rect } = first;
      // Controls are laid out for the new size, so scaling them looks wrong:
      // they stay hidden while the video moves and fade in at the end.
      for (const child of card.children) {
        if (child.querySelector('iframe')) continue;
        child.animate(
          [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }],
          options,
        );
      }
      card.animate(
        [
          {
            transformOrigin: '0 0',
            transform: `translate(${rect.left - last.left}px, ${rect.top - last.top}px) scale(${rect.width / last.width}, ${rect.height / last.height})`,
          },
          { transformOrigin: '0 0', transform: 'none' },
        ],
        options,
      );
    });
  }, [cardRef, layout]);
};
