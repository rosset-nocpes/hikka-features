import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { type FC, useRef } from 'react';
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

import FeatureSwitch from './_base/feature-switch';
import NavigationRow from './_base/navigation-row';
import SettingsGroup from './_base/settings-group';
import UpdateBanner from './_base/update-banner';
import ActivitySettings from './options/activity-settings';
import ExperimentalSettingsPage, {
  ExperimentalSettingsIcon,
} from './options/experimental-settings';
import LocalizedPosterSettings from './options/localized-poster-settings';
import PlayerSettings from './options/player-settings';
import ReaderSettings from './options/reader-settings';
import TeamPrioritySettings from './options/team-priority-settings';
import UserOptions from './options/user-options';

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
  const signedIn = useSettings((state) => Boolean(state.convexSession));

  return (
    <ScrollArea className="h-full" scrollFade>
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={staggerContainerVariants}
        className="flex flex-col gap-3 pb-4"
      >
        <motion.div variants={groupVariants}>
          <SettingsGroup>
            {/* Rows are separated by borders, so no empty one when signed out. */}
            {signedIn
              ? [
                  <UserOptions key="user" />,
                  <ActivitySettings key="activity" />,
                ]
              : [<UserOptions key="user" />]}
          </SettingsGroup>
        </motion.div>

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
            <FeatureSwitch
              feature="aniBackground"
              label="Обкладинки"
              description="Покращене оформлення на сторінках тайтлів, персонажів та правок"
            />
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
            <FeatureSwitch
              feature="aniButtons"
              label="Інші джерела"
              description="Додаткові посилання на сторінках тайтлів"
            />
            <FeatureSwitch
              feature="fandubBlock"
              label="Блок фандаб команд"
              description="Команди, що озвучили чи перекладали тайтл, з їхніми сторінками"
            />
            <FeatureSwitch
              feature="recommendationBlock"
              label="Блок рекомендацій"
              description="Блок і вкладка тайтлу з контентом, схожим на той, який ви дивитеся"
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup
            title="Редагування"
            icon={<MaterialSymbolsDrawRounded className="size-4" />}
          >
            <FeatureSwitch
              feature="editorCharacters"
              label="Пропозиції перекладу імен"
              description="Показує переклад імені українською при редагуванні персонажа"
              beta
            />
            <FeatureSwitch
              feature="editorToolbar"
              label="Панель редактора"
              description="Перевірка правки за правилами, підпис джерела й перехід між правками на розгляді"
              beta
            />
          </SettingsGroup>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
}

const PAGES: Record<Page, { title: string; Content: FC }> = {
  home: { title: 'Налаштування', Content: HomePage },
  player: { title: 'Налаштування програвача', Content: PlayerSettings },
  reader: { title: 'Налаштування читалки', Content: ReaderSettings },
  localizedPoster: {
    title: 'Локалізовані постери',
    Content: LocalizedPosterSettings,
  },
  experimental: {
    title: 'Експериментальні функції',
    Content: ExperimentalSettingsPage,
  },
  teamPriority: { title: 'Пріоритет команд', Content: TeamPrioritySettings },
};

const FADE: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slides in from the side the navigation goes to (`custom` is its
 * direction) and out the other side.
 */
const slide = (
  offset: (direction: number) => string | number,
  blur: string,
  exit: Transition,
): Variants => ({
  enter: (direction: number) => ({
    x: offset(direction),
    filter: `blur(${blur})`,
    opacity: 0,
  }),
  center: { x: 0, filter: 'blur(0px)', opacity: 1 },
  exit: (direction: number) => ({
    x: offset(-direction),
    filter: `blur(${blur})`,
    opacity: 0,
    transition: exit,
  }),
});

const TITLE_SLIDE = slide((direction) => (direction > 0 ? 20 : -20), '2px', {
  duration: 0.12,
});
const PAGE_SLIDE = slide(
  (direction) => (direction > 0 ? '100%' : '-100%'),
  '3px',
  {
    x: { duration: 0.15, ease: EASE_SMOOTH_OUT },
    filter: { duration: 0.1 },
    opacity: { duration: 0.1 },
  },
);

function App() {
  const { enabled, burunyaaMode } = useSettings(
    (state) => state.features.devOptions,
  );
  const { currentPage, direction, goBack } = useNavigation();
  const reduceMotion = useReducedMotion();
  const { title, Content } = PAGES[currentPage];

  const devClicks = useRef(0);

  return (
    <div
      className={cn(
        'flex h-150 w-100 flex-col gap-4 overflow-hidden rounded-none p-4 font-sans font-semibold antialiased',
        burunyaaMode
          ? 'bg-[url(https://media1.tenor.com/m/PDzKPqFw6f8AAAAC/neco-neco-arc.gif)] bg-cover bg-center bg-no-repeat'
          : 'bg-black',
      )}
    >
      <h1 className="flex h-10 items-center text-balance">
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
            variants={reduceMotion ? FADE : TITLE_SLIDE}
            className="flex w-full items-center justify-between gap-1 text-lg font-bold tracking-normal"
          >
            {currentPage === 'home' ? (
              <span className="flex w-full items-center justify-center gap-1">
                <span>{title}</span>
                <ExperimentalSettingsIcon />
              </span>
            ) : (
              <>
                <Button
                  aria-label="Назад"
                  variant="ghost"
                  size="icon-md"
                  onClick={goBack}
                >
                  <MaterialSymbolsChevronLeftRounded className="size-6" />
                </Button>
                {title}
                <div className="size-10" />
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </h1>
      <UpdateBanner />
      <div className="relative flex-1">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={reduceMotion ? FADE : PAGE_SLIDE}
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
            <Content />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="text-muted-foreground flex items-center justify-center gap-3 text-xs">
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
          <div
            aria-hidden="true"
            className="bg-muted-foreground size-1 rounded-full"
          />
          <button
            type="button"
            onClick={() => {
              devClicks.current += 1;
              if (devClicks.current === 5) {
                devClicks.current = 0;
                useSettings
                  .getState()
                  .updateFeatureSettings('devOptions', { enabled: !enabled });
              }
            }}
          >
            v{version}
          </button>
          <div
            aria-hidden="true"
            className="bg-muted-foreground size-1 rounded-full"
          />
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
