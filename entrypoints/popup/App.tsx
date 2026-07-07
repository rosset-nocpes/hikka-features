import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import MaterialSymbolsChevronLeftRounded from '~icons/material-symbols/chevron-left-rounded';
import MaterialSymbolsDrawRounded from '~icons/material-symbols/draw-rounded';
import MaterialSymbolsImageRounded from '~icons/material-symbols/image-rounded';
import MaterialSymbolsPlayCircleRounded from '~icons/material-symbols/play-circle-rounded';
import MaterialSymbolsViewListRounded from '~icons/material-symbols/view-list-rounded';
import MdiGithub from '~icons/mdi/github';
import MdiTelegram from '~icons/mdi/telegram';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import '../app.css';
import { type Page, useNavigation } from '@/hooks/use-navigation';
import { version } from '@/package.json';

import NavigationRow from './_base/navigation-row';
import SettingsGroup from './_base/settings-group';
import AniBackgroundSettings from './options/anibackground-settings';
import AniButtonsSettings from './options/anibuttons-settings';
import CharacterSuggestionsSettings from './options/character-suggestion-settings';
import {
  default as ExperimentalSettingsPage,
  ExperimentalSettingsIcon,
} from './options/experimental-settings';
import FandubSettings from './options/fandub-settings';
import LocalizedPosterSettings from './options/localized-poster-settings';
import PlayerSettings from './options/player-settings';
import ReaderSettings from './options/reader-settings';
import RecommendationBlockSettings from './options/recommendation-block-settings';

if (navigator.userAgent.includes('Firefox')) {
  window.addEventListener('resize', (e) => e.stopImmediatePropagation(), {
    capture: true,
  });

  window.addEventListener('blur', (e) => e.stopImmediatePropagation(), {
    capture: true,
  });
}

const EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1] as const;

const groupVariants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.25, ease: EASE_SMOOTH_OUT },
  },
};

const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

function HomePage() {
  const { navigate } = useNavigation();
  const reduceMotion = useReducedMotion();

  return (
    <ScrollArea className="h-full" scrollFade>
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={staggerContainerVariants}
        className="flex flex-col gap-3 pb-4"
      >
        <motion.div variants={groupVariants}>
          <SettingsGroup
            title="Медіа"
            icon={<MaterialSymbolsPlayCircleRounded className="size-4" />}
          >
            <NavigationRow
              label="Програвач"
              description="Налаштування програвача"
              onClick={() => navigate('player')}
            />
            <NavigationRow
              label="Читалка"
              description="Налаштування читалки"
              onClick={() => navigate('reader')}
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup
            title="Оформлення"
            icon={<MaterialSymbolsImageRounded className="size-4" />}
          >
            <AniBackgroundSettings grouped />
            <NavigationRow
              label="Локалізовані постери"
              description="Налаштування локалізованих постерів"
              onClick={() => navigate('localizedPoster')}
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup
            title="Контент"
            icon={<MaterialSymbolsViewListRounded className="size-4" />}
          >
            <AniButtonsSettings grouped />
            <FandubSettings grouped />
            <RecommendationBlockSettings grouped />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup
            title="Редагування"
            icon={<MaterialSymbolsDrawRounded className="size-4" />}
          >
            <CharacterSuggestionsSettings grouped />
          </SettingsGroup>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
}

const PAGE_TITLES: Record<Page, string> = {
  home: 'Налаштування',
  player: 'Налаштування програвача',
  reader: 'Налаштування читалки',
  localizedPoster: 'Локалізовані постери',
  experimental: 'Експерементальні функції',
};

function App() {
  const { enabled, burunyaaMode } = useSettings().features.devOptions;
  const { updateFeatureSettings } = useSettings();
  const { currentPage, direction, goBack } = useNavigation();
  const reduceMotion = useReducedMotion();

  let devClicked = 0;

  const pageVariants = reduceMotion
    ? {
        enter: () => ({ opacity: 0 }),
        center: { opacity: 1 },
        exit: () => ({ opacity: 0 }),
      }
    : {
        enter: (dir: number) => ({
          x: dir > 0 ? '100%' : '-100%',
          filter: 'blur(3px)',
          opacity: 0,
        }),
        center: {
          x: 0,
          filter: 'blur(0px)',
          opacity: 1,
        },
        exit: (dir: number) => ({
          x: dir > 0 ? '-100%' : '100%',
          filter: 'blur(3px)',
          opacity: 0,
          transition: {
            x: { duration: 0.15, ease: EASE_SMOOTH_OUT },
            filter: { duration: 0.1 },
            opacity: { duration: 0.1 },
          },
        }),
      };

  return (
    <div
      className={cn(
        'flex h-150 w-100 flex-col gap-4 rounded-none p-4 font-sans font-semibold antialiased',
        burunyaaMode
          ? 'bg-[url(https://media1.tenor.com/m/PDzKPqFw6f8AAAAC/neco-neco-arc.gif)] bg-cover bg-center bg-no-repeat'
          : 'bg-black',
      )}
    >
      <h3 className="flex h-10 items-center text-balance">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.span
            key={currentPage}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    x: { duration: 0.2, ease: EASE_SMOOTH_OUT },
                    filter: { duration: 0.15 },
                    opacity: { duration: 0.15 },
                  }
            }
            variants={
              reduceMotion
                ? {
                    enter: { opacity: 0 },
                    center: { opacity: 1 },
                    exit: { opacity: 0 },
                  }
                : {
                    enter: (dir: number) => ({
                      x: dir > 0 ? 20 : -20,
                      opacity: 0,
                      filter: 'blur(2px)',
                    }),
                    center: { x: 0, opacity: 1, filter: 'blur(0px)' },
                    exit: (dir: number) => ({
                      x: dir > 0 ? -20 : 20,
                      opacity: 0,
                      filter: 'blur(2px)',
                      transition: { duration: 0.12 },
                    }),
                  }
            }
            className="flex w-full items-center justify-between gap-1 text-lg font-bold tracking-normal"
          >
            {currentPage === 'home' ? (
              <span className="flex w-full items-center justify-center gap-1">
                <span>{PAGE_TITLES.home}</span>
                <ExperimentalSettingsIcon />
              </span>
            ) : (
              <>
                <Button variant="ghost" size="icon-md" onClick={goBack}>
                  <MaterialSymbolsChevronLeftRounded className="size-6" />
                </Button>
                {PAGE_TITLES[currentPage]}
                <div className="size-10" />
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </h3>
      <div className="relative flex-1">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    x: { duration: 0.25, ease: EASE_SMOOTH_OUT },
                    filter: { duration: 0.2 },
                    opacity: { duration: 0.2 },
                  }
            }
            className="absolute inset-0"
          >
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'player' && <PlayerSettings />}
            {currentPage === 'reader' && <ReaderSettings />}
            {currentPage === 'localizedPoster' && <LocalizedPosterSettings />}
            {currentPage === 'experimental' && <ExperimentalSettingsPage />}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-3 text-xs text-[#5C5C5C]">
        <a
          href="https://github.com/rosset-nocpes/hikka-features"
          target="_blank"
          rel="noopener"
          className="flex flex-1 items-center justify-center gap-1 font-bold"
        >
          <MdiGithub />
          GitHub
        </a>
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="size-1 rounded-full bg-[#5C5C5C]" />
          <button
            type="button"
            onClick={() => {
              devClicked++;
              if (devClicked === 5) {
                updateFeatureSettings('devOptions', { enabled: !enabled });
                devClicked = 0;
              }
            }}
          >
            v{version}
          </button>
          <div className="size-1 rounded-full bg-[#5C5C5C]" />
        </div>
        <a
          href="https://t.me/hikka_features"
          target="_blank"
          rel="noopener"
          className="flex flex-1 items-center justify-center gap-1 font-bold"
        >
          <MdiTelegram />
          TG канал
        </a>
      </div>
    </div>
  );
}

export default App;
