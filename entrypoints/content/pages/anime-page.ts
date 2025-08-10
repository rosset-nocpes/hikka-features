import aniBackground from '../modules/ani-background';
import aniButtons from '../modules/ani-buttons';
import devButtons from '../modules/dev-buttons';
import fandubBlock from '../modules/fandub-block';
import localizedPosterButton from '../modules/localized-poster/localized-poster-button';
import watchButton from '../modules/player/watchButton';
import recommendationBlock from '../modules/recommendation-block';

const anime_page = async () => {
  const path = usePageStore.getState().path;

  const mal_id = parseInt(
    (document.head.querySelector('[name=mal-id][content]') as HTMLMetaElement)
      ?.content,
  );

  if (path?.length === 2) {
    await prefetchHikkaAnime();

    (await devButtons())?.mount();

    // Watch button
    (await watchButton())?.mount();

    // aniButtons
    (await aniButtons())?.mount();

    // recommendationBlock
    (await recommendationBlock())?.mount();

    (await fandubBlock())?.mount();
    (await localizedPosterButton())?.mount();
  }

  // aniBackground
  if (path?.length! >= 2) {
    (await aniBackground(mal_id, 'anime'))?.mount();
    usePageStore.getState().setMALId(mal_id);
  } else {
    usePageStore.getState().clearMALId();
  }
};

export default anime_page;
