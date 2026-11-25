import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import {
  type FC,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
} from 'react';
import MaterialSymbolsArticleRounded from '~icons/material-symbols/article-rounded';
import MaterialSymbolsChevronLeftRounded from '~icons/material-symbols/chevron-left-rounded';
import MaterialSymbolsDiversity3Rounded from '~icons/material-symbols/diversity-3-rounded';
import MaterialSymbolsEditNoteRounded from '~icons/material-symbols/edit-note-rounded';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';
import MaterialSymbolsMenuBookRounded from '~icons/material-symbols/menu-book-rounded';
import MaterialSymbolsPlayCircleRounded from '~icons/material-symbols/play-circle-rounded';
import MaterialSymbolsSettingsBackupRestoreRounded from '~icons/material-symbols/settings-backup-restore-rounded';
import MdiGithub from '~icons/mdi/github';
import MdiTelegram from '~icons/mdi/telegram';

import ExtensionLogo from '@/assets/icon.png';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GITHUB_REPO_URL, TELEGRAM_CHANNEL_URL } from '@/constants/links';
import { useActivitySharing } from '@/hooks/use-activity-sharing';
import { type Page, useNavigation } from '@/hooks/use-navigation';
import { version } from '@/package.json';
import { NEW_TAB } from '@/utils/hikka-router';

import ActionRow from './_base/action-row';
import ConfirmButton from './_base/confirm-button';
import FeatureSwitch, { type Features } from './_base/feature-switch';
import NavigationRow from './_base/navigation-row';
import { resetPreferences } from './_base/reset-settings';
import SettingsGroup from './_base/settings-group';
import UpdateBanner from './_base/update-banner';
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

/**
 * The switches behind each section page, to count how many are on. Ones
 * that need an account count only while signed in, as the page shows them.
 * Activity sharing, kept in the account, is added by `CommunityRow`. Keep in
 * step with the switches on options/{title-page,community,editing}-settings.
 */
const SECTION_SWITCHES: Record<
  'titlePages' | 'community' | 'editing',
  { on: (features: Features) => boolean; account?: boolean }[]
> = {
  titlePages: [
    { on: (f) => f.aniBackground.enabled },
    { on: (f) => f.localizedPoster.enabled },
    { on: (f) => f.localizedPoster.enabled && f.localizedPoster.autoShow },
    { on: (f) => f.fandubBlock.enabled },
    { on: (f) => f.recommendationBlock.enabled },
    { on: (f) => f.musicPlayer.enabled },
    { on: (f) => f.aniButtons.enabled },
  ],
  community: [
    { on: (f) => f.watchTogetherInvites.enabled, account: true },
    { on: (f) => f.releaseNotifications.enabled, account: true },
    { on: (f) => !f.friendsActivity.hidden },
    { on: (f) => f.teamLinks.enabled },
  ],
  editing: [
    { on: (f) => f.editorToolbar.enabled },
    { on: (f) => f.editorCharacters.enabled },
  ],
};

interface SectionRowProps {
  section: keyof typeof SECTION_SWITCHES;
  icon: ReactNode;
  label: string;
  description: string;
  /** One more switch to count, kept elsewhere; undefined while unknown. */
  extra?: boolean;
}

/** Opens a section page, saying how many of its switches are on. */
function SectionRow({ section, extra, ...props }: SectionRowProps) {
  const { navigate } = useNavigation();
  const signedIn = useSettings((state) => Boolean(state.convexSession));
  const switches = SECTION_SWITCHES[section].filter(
    (entry) => signedIn || !entry.account,
  );
  const on =
    useSettings(
      (state) => switches.filter((entry) => entry.on(state.features)).length,
    ) + (extra ? 1 : 0);
  const total = switches.length + (extra === undefined ? 0 : 1);

  return (
    <NavigationRow
      {...props}
      active={on > 0}
      value={
        <>
          {on} з {total}
          <span className="sr-only"> увімкнено</span>
        </>
      }
      onClick={() => navigate(section)}
    />
  );
}

/** Counts activity sharing too, which only an account has. */
function SignedInCommunityRow(props: SectionRowProps) {
  const { shared } = useActivitySharing();
  return <SectionRow {...props} extra={shared} />;
}

function CommunityRow(props: SectionRowProps) {
  const signedIn = useSettings((state) => Boolean(state.convexSession));
  return signedIn ? (
    <SignedInCommunityRow {...props} />
  ) : (
    <SectionRow {...props} />
  );
}

function HomePage() {
  const { navigate } = useNavigation();
  const reduceMotion = useReducedMotion();
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
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup title="Медіа">
            <NavigationRow
              icon={<MaterialSymbolsPlayCircleRounded />}
              active={playerEnabled}
              value={
                playerEnabled ? undefined : (
                  <>
                    <span aria-hidden="true">Вимк.</span>
                    <span className="sr-only">Вимкнено</span>
                  </>
                )
              }
              label="Програвач"
              description="Джерело, заставки й команди"
              onClick={() => navigate('player')}
            />
            <FeatureSwitch
              feature="reader"
              icon={<MaterialSymbolsMenuBookRounded />}
              label="Читалка"
              description="Кнопка «Читати» для манґи й ранобе"
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup title="Сайт">
            <SectionRow
              section="titlePages"
              icon={<MaterialSymbolsArticleRounded />}
              label="Сторінки тайтлів"
              description="Оформлення, музика й блоки"
            />
            <CommunityRow
              section="community"
              icon={<MaterialSymbolsDiversity3Rounded />}
              label="Спільнота"
              description="Друзі й команди"
            />
            <SectionRow
              section="editing"
              icon={<MaterialSymbolsEditNoteRounded />}
              label="Редагування"
              description="Інструменти для правок"
            />
          </SettingsGroup>
        </motion.div>

        <motion.div variants={groupVariants}>
          <SettingsGroup>
            <ActionRow
              icon={<MaterialSymbolsSettingsBackupRestoreRounded />}
              label="Скинути налаштування"
              description="Улюблені команди й пріоритет залишаться"
            >
              <ConfirmButton
                label="Скинути налаштування"
                onConfirm={resetPreferences}
              >
                Скинути
              </ConfirmButton>
            </ActionRow>
          </SettingsGroup>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
}

/**
 * The sub-pages, loaded apart from the home page so the popup opens sooner,
 * and fetched while it idles so going to one never waits.
 */
const loadPlayerSettings = () => import('./options/player-settings');
const loadTeamPrioritySettings = () =>
  import('./options/team-priority-settings');
const loadTitlePageSettings = () => import('./options/title-page-settings');
const loadCommunitySettings = () => import('./options/community-settings');
const loadEditingSettings = () => import('./options/editing-settings');
const loadExperimentalSettings = () =>
  import('./options/experimental-settings');

const LOADERS = [
  loadPlayerSettings,
  loadTeamPrioritySettings,
  loadTitlePageSettings,
  loadCommunitySettings,
  loadEditingSettings,
  loadExperimentalSettings,
];

const prefetchPages = () => {
  for (const load of LOADERS) void load().catch(() => undefined);
};

const PAGES: Record<Page, { title: string; Content: FC }> = {
  home: { title: 'Hikka Features', Content: HomePage },
  player: { title: 'Програвач', Content: lazy(loadPlayerSettings) },
  teamPriority: {
    title: 'Пріоритет команд',
    Content: lazy(loadTeamPrioritySettings),
  },
  titlePages: {
    title: 'Сторінки тайтлів',
    Content: lazy(loadTitlePageSettings),
  },
  community: { title: 'Спільнота', Content: lazy(loadCommunitySettings) },
  editing: { title: 'Редагування', Content: lazy(loadEditingSettings) },
  experimental: {
    title: 'Експериментальні функції',
    Content: lazy(loadExperimentalSettings),
  },
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
          href={GITHUB_REPO_URL}
          {...NEW_TAB}
          aria-label="GitHub"
          title="GitHub"
          className={LINK_CLASS}
        >
          <MdiGithub />
        </a>
        <a
          href={TELEGRAM_CHANNEL_URL}
          {...NEW_TAB}
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

  useEffect(() => {
    // After the first paint; Safari has no requestIdleCallback.
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(prefetchPages, { timeout: 1_000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(prefetchPages, 200);
    return () => clearTimeout(id);
  }, []);

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
            <Suspense fallback={null}>
              <Content />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
