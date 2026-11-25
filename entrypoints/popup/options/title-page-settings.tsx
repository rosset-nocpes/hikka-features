import MaterialSymbolsAutoAwesomeRounded from '~icons/material-symbols/auto-awesome-rounded';
import MaterialSymbolsGroupsRounded from '~icons/material-symbols/groups-rounded';
import MaterialSymbolsLibraryMusicRounded from '~icons/material-symbols/library-music-rounded';
import MaterialSymbolsLinkRounded from '~icons/material-symbols/link-rounded';
import MaterialSymbolsRecommendRounded from '~icons/material-symbols/recommend-rounded';
import MaterialSymbolsTranslateRounded from '~icons/material-symbols/translate-rounded';
import MaterialSymbolsWallpaperRounded from '~icons/material-symbols/wallpaper-rounded';

import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const TitlePageSettings = () => {
  const posterEnabled = useSettings(
    (state) => state.features.localizedPoster.enabled,
  );

  return (
    <SettingsPage>
      <SettingsGroup title="Оформлення">
        <FeatureSwitch
          feature="aniBackground"
          icon={<MaterialSymbolsWallpaperRounded />}
          label="Обкладинки"
          description="Фонові обкладинки на сторінках тайтлів, персонажів і правок"
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
          disabled={!posterEnabled}
          icon={<MaterialSymbolsAutoAwesomeRounded />}
          label="Автолокалізація постера"
          description={
            posterEnabled
              ? 'Одразу показує локалізований постер, якщо він є'
              : 'Спершу увімкніть локалізовані постери'
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Блоки">
        <FeatureSwitch
          feature="fandubBlock"
          icon={<MaterialSymbolsGroupsRounded />}
          label="Фандаб-команди"
          description="Хто озвучив чи переклав тайтл, з посиланнями на команди"
        />
        <FeatureSwitch
          feature="recommendationBlock"
          icon={<MaterialSymbolsRecommendRounded />}
          label="Рекомендації"
          description="Схожі тайтли: блок на сторінці й окрема вкладка"
        />
        <FeatureSwitch
          feature="musicPlayer"
          icon={<MaterialSymbolsLibraryMusicRounded />}
          label="Опенінги та ендінги"
          description="Треки в блоці музики, плаваючий програвач і улюблена музика в профілі"
        />
        <FeatureSwitch
          feature="aniButtons"
          icon={<MaterialSymbolsLinkRounded />}
          label="Інші джерела"
          description="Посилання на MyAnimeList, AniList, AniDB та інші бази"
        />
      </SettingsGroup>
    </SettingsPage>
  );
};

export default TitlePageSettings;
