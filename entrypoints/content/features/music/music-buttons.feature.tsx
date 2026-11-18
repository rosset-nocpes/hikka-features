import { motion } from 'motion/react';
import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';

import { Button } from '@/components/ui/button';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { OST_LABEL, useAnimeMusic } from './animethemes';
import Equalizer from './equalizer';
import { playMusic } from './music-player';
import { currentTrack, useMusic } from './use-music';

/**
 * The covers of the "Музика" tab's cards, on an anime's page and its media
 * page. Unlike the videos' covers, they hold an icon, not an image.
 */
const findCovers = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '#content-media [data-slot="aspect-ratio"]',
    ),
  ).filter(
    (cover) =>
      !cover.querySelector('img') &&
      !!cover.nextElementSibling?.querySelector('span'),
  );

type ButtonUi = Awaited<ReturnType<typeof createFeatureUi>>;

/** The cover a button's UI was put on. */
const coverOf = (container: HTMLElement) =>
  (container.getRootNode() as ShadowRoot).host.parentElement as HTMLElement;

/**
 * A play button on each opening and ending in hikka.io's music block, for
 * the floating music player. Hikka's React owns the cards and swaps them
 * with the block's tab, so the buttons follow the covers on the page.
 */
export default class MusicButtonsFeature extends BaseFeature {
  readonly id = 'music-play-button';
  readonly pages = [HikkaPages.AnimeContent];
  /**
   * A UI per card position, made once and moved onto whichever cover is
   * there: WXT keeps every UI it made until the content script goes, so
   * one per cover would pile up with each tab switch and page.
   */
  private slots: (ButtonUi | undefined)[] = [];
  private creating = new Set<number>();

  async init() {}

  override get shouldMount(): boolean {
    return (
      super.shouldMount && useSettings.getState().features.musicPlayer.enabled
    );
  }

  /** On its page: a button on every cover and none elsewhere. Off it: any mounted. */
  override get isMounted(): boolean {
    if (!this.shouldMount) return this.slots.some((ui) => ui?.mounted);
    const covers = findCovers();
    const length = Math.max(covers.length, this.slots.length);
    return Array.from({ length }, (_, index) => this.slots[index]).every(
      (ui, index) =>
        index < covers.length
          ? !!ui?.mounted && ui.shadowHost.parentElement === covers[index]
          : !ui?.mounted,
    );
  }

  /** Puts a button on each cover, moving the ones whose cover changed. */
  override mount() {
    const covers = findCovers();
    this.slots.forEach((ui, index) => {
      if (ui?.mounted && ui.shadowHost.parentElement !== covers[index]) {
        ui.remove();
      }
    });
    covers.forEach((_, index) => {
      const ui = this.slots[index];
      if (ui) {
        if (!ui.mounted) ui.mount();
        return;
      }
      if (this.creating.has(index)) return;
      this.creating.add(index);
      void this.createUi({
        position: 'inline',
        anchor: () => findCovers()[index],
        append: 'last',
        hostCss:
          'position: absolute !important; right: 0.5rem; bottom: 0.5rem; z-index: 1;',
        render: (container) => <PlayButton cover={coverOf(container)} />,
      }).then((created) => {
        this.slots[index] = created;
        this.creating.delete(index);
        if (this.shouldMount) this.mount();
      });
    });
  }

  override unmount() {
    this.slots.forEach((ui) => {
      if (ui?.mounted) ui.remove();
    });
  }
}

const PlayButton = ({ cover }: { cover: HTMLElement }) => {
  const { enabled } = useSettings().features.musicPlayer;
  const { slug } = usePageStore();
  const { data: anime } = useHikka();
  // Nothing goes to AnimeThemes while the feature is off.
  const tracks = useAnimeMusic(enabled ? anime : undefined, slug);

  // The card's title and type, under its cover.
  const meta = cover.nextElementSibling;
  const title = meta?.querySelector('span')?.textContent?.trim();
  const kind = meta?.querySelector('p')?.textContent?.trim();
  const sameTitle = tracks?.filter((track) => track.title.trim() === title);
  const track =
    sameTitle?.find((candidate) => OST_LABEL[candidate.type] === kind) ??
    sameTitle?.[0];

  const isCurrent = useMusic(
    (state) => !!track && currentTrack(state)?.key === track.key,
  );
  const playing = useMusic((state) => state.playing) && isCurrent;

  if (!enabled || !tracks || !track) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        size="icon-md"
        aria-label={playing ? 'Призупинити' : `Слухати «${track.title}»`}
        aria-pressed={playing}
        className="group/play rounded-full shadow-md transition-transform hover:scale-105 active:scale-95"
        onClick={() =>
          isCurrent
            ? useMusic.getState().toggle()
            : playMusic(tracks, tracks.indexOf(track))
        }
      >
        {playing ? (
          <>
            <Equalizer playing className="group-hover/play:hidden" />
            <MaterialSymbolsPauseRounded className="hidden size-6 group-hover/play:block" />
          </>
        ) : (
          <MaterialSymbolsPlayArrowRounded className="size-6" />
        )}
      </Button>
    </motion.div>
  );
};
