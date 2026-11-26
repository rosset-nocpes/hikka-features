import { useEffect, useState } from 'react';
import MaterialSymbolsAutoStoriesOutlineRounded from '~icons/material-symbols/auto-stories-outline-rounded';
import MaterialSymbolsFormatAlignJustifyRounded from '~icons/material-symbols/format-align-justify-rounded';
import MaterialSymbolsMenuBookRounded from '~icons/material-symbols/menu-book-rounded';
import MaterialSymbolsMobileLockPortraitOutlineRounded from '~icons/material-symbols/mobile-lock-portrait-outline-rounded';
import MaterialSymbolsPaletteOutlineRounded from '~icons/material-symbols/palette-outline-rounded';
import MaterialSymbolsSettingsBackupRestoreRounded from '~icons/material-symbols/settings-backup-restore-rounded';
import MaterialSymbolsSwipeRounded from '~icons/material-symbols/swipe-rounded';
import MaterialSymbolsTouchAppOutlineRounded from '~icons/material-symbols/touch-app-outline-rounded';
import MaterialSymbolsViewDayOutlineRounded from '~icons/material-symbols/view-day-outline-rounded';
import MaterialSymbolsWallpaperRounded from '~icons/material-symbols/wallpaper-rounded';

import {
  MANGA_BACKGROUNDS,
  NOVEL_THEMES,
  READING_MODES,
} from '@/entrypoints/content/features/reader/reader.constants';
import { MangaReadingMode } from '@/entrypoints/content/features/reader/reader.enums';
import {
  changePreferences,
  followPreferences,
  type Preferences,
  type PreferencesChange,
  readPreferences,
  resetReaderPreferences,
} from '@/entrypoints/content/features/reader/reader.preferences';

import ActionRow from '../_base/action-row';
import ConfirmButton from '../_base/confirm-button';
import FeatureSwitch from '../_base/feature-switch';
import SegmentedOption from '../_base/segmented-option';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';
import SwitchOption from '../_base/switch-option';

/** The modes by the way pages turn, short enough for one line each. */
const MODE_OPTIONS = READING_MODES.map(({ value }) => ({
  value,
  label: {
    [MangaReadingMode.LeftToRight]: 'Праворуч',
    [MangaReadingMode.RightToLeft]: 'Ліворуч',
    [MangaReadingMode.Vertical]: 'Донизу',
    [MangaReadingMode.Strip]: 'Стрічка',
  }[value],
}));

/**
 * The reader's saved settings, following changes from the reader itself,
 * with a way to change them that shows at once and saves behind.
 */
const useReaderPreferences = () => {
  const [preferences, setPreferences] = useState<Preferences>();

  useEffect(() => {
    let mounted = true;
    const load = () =>
      void readPreferences().then((loaded) => {
        if (mounted) setPreferences(loaded);
      });
    load();
    const unfollow = followPreferences(load);
    return () => {
      mounted = false;
      unfollow();
    };
  }, []);

  const change = (update: PreferencesChange) => {
    setPreferences(
      (current) =>
        current && {
          ...current,
          manga: { ...current.manga, ...update.manga },
          novel: { ...current.novel, ...update.novel },
          keepAwake: update.keepAwake ?? current.keepAwake,
        },
    );
    void changePreferences(update);
  };

  return { preferences, change };
};

/**
 * The reader's lasting choices: how manga reads and looks, a novel's
 * theme. Ones to judge by eye, like text size or strip width, stay in the
 * reader, where the page shows them change.
 */
const ReaderSettings = () => {
  const enabled = useSettings((state) => state.features.reader.enabled);
  const { preferences, change } = useReaderPreferences();

  // Read in a moment; an empty page meanwhile beats one that jumps.
  if (!preferences) return null;
  const { manga, novel, keepAwake } = preferences;
  const isStrip = manga.readingMode === MangaReadingMode.Strip;
  const isSideways =
    manga.readingMode === MangaReadingMode.LeftToRight ||
    manga.readingMode === MangaReadingMode.RightToLeft;

  return (
    <SettingsPage>
      <SettingsGroup
        footer={
          enabled
            ? undefined
            : 'Налаштування нижче почнуть діяти, щойно кнопку буде увімкнено.'
        }
      >
        <FeatureSwitch
          feature="reader"
          icon={<MaterialSymbolsMenuBookRounded />}
          label="Кнопка «Читати»"
          description="Відкриває читалку на сторінках манґи й ранобе"
        />
      </SettingsGroup>

      <SettingsGroup title="Манґа">
        <SegmentedOption
          icon={<MaterialSymbolsSwipeRounded />}
          stacked
          label="Режим читання"
          description={
            READING_MODES.find(({ value }) => value === manga.readingMode)
              ?.description
          }
          value={manga.readingMode}
          options={MODE_OPTIONS}
          onChange={(readingMode) => change({ manga: { readingMode } })}
        />
        <SwitchOption
          icon={<MaterialSymbolsViewDayOutlineRounded />}
          label="Стрічка для манхви"
          description="Розділи з довгими сторінками відкриваються стрічкою"
          checked={manga.autoStrip}
          disabled={isStrip}
          onClick={() => change({ manga: { autoStrip: !manga.autoStrip } })}
        />
        <SwitchOption
          icon={<MaterialSymbolsAutoStoriesOutlineRounded />}
          label="Розворот"
          description={
            isSideways
              ? 'Дві сторінки поруч на широкому екрані'
              : 'Лише коли сторінки гортаються вбік'
          }
          checked={manga.doublePage}
          disabled={!isSideways}
          onClick={() => change({ manga: { doublePage: !manga.doublePage } })}
        />
        <SwitchOption
          icon={<MaterialSymbolsTouchAppOutlineRounded />}
          label="Гортання дотиком"
          description={
            isStrip
              ? 'Стрічку гортають прокручуванням'
              : 'Клік чи дотик до лівого або правого краю сторінки гортає її'
          }
          checked={manga.tapToTurn}
          disabled={isStrip}
          onClick={() => change({ manga: { tapToTurn: !manga.tapToTurn } })}
        />
        <SegmentedOption
          icon={<MaterialSymbolsWallpaperRounded />}
          stacked
          label="Фон"
          description="Що видно довкола сторінок"
          value={manga.background}
          options={MANGA_BACKGROUNDS}
          onChange={(background) => change({ manga: { background } })}
        />
      </SettingsGroup>

      <SettingsGroup title="Ранобе">
        <SegmentedOption
          icon={<MaterialSymbolsPaletteOutlineRounded />}
          stacked
          label="Тема"
          description="Кольори сторінки"
          value={novel.theme}
          options={NOVEL_THEMES}
          onChange={(theme) => change({ novel: { theme } })}
        />
        <SwitchOption
          icon={<MaterialSymbolsFormatAlignJustifyRounded />}
          label="Вирівнювання за шириною"
          description="Рівні краї рядків, з переносами слів"
          checked={novel.justify}
          onClick={() => change({ novel: { justify: !novel.justify } })}
        />
      </SettingsGroup>

      <SettingsGroup footer="Шрифт, розмір тексту, ширину стрічки й решту змінюйте в самій читалці: там одразу видно, як виглядає сторінка.">
        <SwitchOption
          icon={<MaterialSymbolsMobileLockPortraitOutlineRounded />}
          label="Не вимикати екран"
          description="Екран не гасне, поки відкрита читалка"
          checked={keepAwake}
          onClick={() => change({ keepAwake: !keepAwake })}
        />
        <ActionRow
          icon={<MaterialSymbolsSettingsBackupRestoreRounded />}
          label="Скинути налаштування читалки"
          description="Сортування розділів залишиться"
        >
          <ConfirmButton
            label="Скинути налаштування читалки"
            onConfirm={() => void resetReaderPreferences()}
          >
            Скинути
          </ConfirmButton>
        </ActionRow>
      </SettingsGroup>
    </SettingsPage>
  );
};

export default ReaderSettings;
