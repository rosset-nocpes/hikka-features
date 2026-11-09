import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { type FC, useRef } from 'react';
import MaterialSymbolsAutoAwesomeRounded from '~icons/material-symbols/auto-awesome-rounded';
import MaterialSymbolsChevronLeftRounded from '~icons/material-symbols/chevron-left-rounded';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';
import MaterialSymbolsFactCheckRounded from '~icons/material-symbols/fact-check-rounded';
import MaterialSymbolsGroupsRounded from '~icons/material-symbols/groups-rounded';
import MaterialSymbolsLinkRounded from '~icons/material-symbols/link-rounded';
import MaterialSymbolsMenuBookRounded from '~icons/material-symbols/menu-book-rounded';
import MaterialSymbolsPersonEditRounded from '~icons/material-symbols/person-edit-rounded';
import MaterialSymbolsPlayCircleRounded from '~icons/material-symbols/play-circle-rounded';
import MaterialSymbolsRecommendRounded from '~icons/material-symbols/recommend-rounded';
import MaterialSymbolsTranslateRounded from '~icons/material-symbols/translate-rounded';
import MaterialSymbolsWallpaperRounded from '~icons/material-symbols/wallpaper-rounded';
import MdiGithub from '~icons/mdi/github';
import MdiTelegram from '~icons/mdi/telegram';

import ExtensionLogo from '@/assets/icon.png';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Page, useNavigation } from '@/hooks/use-navigation';
import { version } from '@/package.json';

import FeatureSwitch from './_base/feature-switch';
import NavigationRow from './_base/navigation-row';
import SettingsGroup from './_base/settings-group';
import UpdateBanner from './_base/update-banner';
import ActivitySettings from './options/activity-settings';
import ExperimentalSettingsPage from './options/experimental-settings';
import PlayerSettings from './options/player-settings';
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
  const playerEnabled = useSettings((state) => state.features.player.enabled);

  return (
    <ScrollArea className="h-full" scrollFade>
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={staggerContainerVariants}
        className="flex flex-col gap-5 pb-4"
      >
        <motion.div variants={groupVariants}>
          <SettingsGroup>
            <UserOptions />
            {signedIn && <ActivitySettings />}
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup title="Медіа">
            <NavigationRow
              icon={<MaterialSymbolsPlayCircleRounded />}
              active={playerEnabled}
              label="Програвач"
              description={
                playerEnabled
                  ? 'Джерело, мінірежим і пріоритет команд'
                  : 'Кнопку перегляду вимкнено'
              }
              onClick={() => navigate('player')}
            />
            <FeatureSwitch
              feature="reader"
              icon={<MaterialSymbolsMenuBookRounded />}
              label="Читалка"
              description="Кнопка «Читати» на сторінках манґи й ранобе"
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup title="Оформлення">
            <FeatureSwitch
              feature="aniBackground"
              icon={<MaterialSymbolsWallpaperRounded />}
              label="Обкладинки"
              description="Покращене оформлення на сторінках тайтлів, персонажів та правок"
            />
            <FeatureSwitch
              feature="localizedPoster"
              icon={<MaterialSymbolsTranslateRounded />}
              label="Локалізовані постери"
              description="Кнопка, що показує постер українською"
            />
            <FeatureSwitch
              feature="localizedPoster"
              option="autoShow"
              icon={<MaterialSymbolsAutoAwesomeRounded />}
              label="Автолокалізація постера"
              description="Одразу замінює постер локалізованою версією"
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup title="Контент">
            <FeatureSwitch
              feature="aniButtons"
              icon={<MaterialSymbolsLinkRounded />}
              label="Інші джерела"
              description="Додаткові посилання на сторінках тайтлів"
            />
            <FeatureSwitch
              feature="fandubBlock"
              icon={<MaterialSymbolsGroupsRounded />}
              label="Блок фандаб команд"
              description="Команди, що озвучили чи перекладали тайтл, з їхніми сторінками"
            />
            <FeatureSwitch
              feature="recommendationBlock"
              icon={<MaterialSymbolsRecommendRounded />}
              label="Блок рекомендацій"
              description="Блок і вкладка тайтлу з контентом, схожим на той, який ви дивитеся"
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup title="Редагування">
            <FeatureSwitch
              feature="editorCharacters"
              icon={<MaterialSymbolsPersonEditRounded />}
              label="Пропозиції перекладу імен"
              description="Показує переклад імені українською при редагуванні персонажа"
              beta
            />
            <FeatureSwitch
              feature="editorToolbar"
              icon={<MaterialSymbolsFactCheckRounded />}
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
  home: { title: 'Hikka Features', Content: HomePage },
  player: { title: 'Програвач', Content: PlayerSettings },
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

const LINK_CLASS =
  'text-muted-foreground hover:text-foreground hover:bg-accent/60 focus-visible:ring-ring/50 grid size-8 place-items-center rounded-lg transition-colors outline-none focus-visible:ring-2 [&>svg]:size-4.5';

function HomeHeader() {
  const { enabled } = useSettings((state) => state.features.devOptions);
  const { navigate } = useNavigation();
  const devClicks = useRef(0);

  return (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        <img src={ExtensionLogo} alt="" className="size-8 shrink-0" />
        <span className="flex min-w-0 flex-col">
          <h1 className="truncate text-base leading-tight font-semibold">
            Hikka Features
          </h1>
          {/* Five clicks show or hide the experimental page. */}
          <button
            type="button"
            className="text-muted-foreground w-fit text-xs leading-tight font-normal tabular-nums"
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
        </span>
      </span>
      <span className="flex items-center gap-0.5">
        <AnimatePresence initial={false}>
          {enabled && (
            <motion.button
              type="button"
              aria-label="Експериментальні функції"
              title="Експериментальні функції"
              onClick={() => navigate('experimental')}
              initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className={LINK_CLASS}
            >
              <MaterialSymbolsExperiment />
            </motion.button>
          )}
        </AnimatePresence>
        <a
          href="https://github.com/rosset-nocpes/hikka-features"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          title="GitHub"
          className={LINK_CLASS}
        >
          <MdiGithub />
        </a>
        <a
          href="https://t.me/hikka_features"
          target="_blank"
          rel="noopener"
          aria-label="Telegram-канал"
          title="Telegram-канал"
          className={LINK_CLASS}
        >
          <MdiTelegram />
        </a>
      </span>
    </>
  );
}

function App() {
  const burunyaaMode = useSettings(
    (state) => state.features.devOptions.burunyaaMode,
  );
  const { currentPage, direction, goBack } = useNavigation();
  const reduceMotion = useReducedMotion();
  const { title, Content } = PAGES[currentPage];

  return (
    <div
      className={cn(
        'flex h-150 w-100 flex-col gap-4 overflow-hidden rounded-none p-4 font-sans antialiased',
        burunyaaMode
          ? 'bg-[url(https://media1.tenor.com/m/PDzKPqFw6f8AAAAC/neco-neco-arc.gif)] bg-cover bg-center bg-no-repeat'
          : 'bg-black',
      )}
    >
      <header className="flex h-10 shrink-0 items-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
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
            className="flex w-full items-center justify-between gap-2"
          >
            {currentPage === 'home' ? (
              <HomeHeader />
            ) : (
              <span className="flex min-w-0 items-center gap-1">
                <Button
                  aria-label="Назад"
                  variant="ghost"
                  size="icon-md"
                  className="-ml-2"
                  onClick={goBack}
                >
                  <MaterialSymbolsChevronLeftRounded className="size-6" />
                </Button>
                <h1 className="truncate text-base font-semibold">{title}</h1>
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </header>
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
    </div>
  );
}

export default App;
