import aniBackground from '../modules/ani-background';
import aniButtons from '../modules/ani-buttons';
import devButtons from '../modules/dev-buttons';
import fandubBlock from '../modules/fandub-block';
import localizedPosterButton from '../modules/localized-poster/localized-poster-button';
import watchButton from '../modules/player/watch-button';
import recommendationBlock from '../modules/recommendation-block';

const anime_page = async () => {
  const path = usePageStore.getState().path;

  const mal_id = getLocalMALId();

  if (path?.length === 2) {
    await prefetchHikkaAnime();

    await Promise.allSettled(
      [
        devButtons,
        watchButton,
        aniButtons,
        recommendationBlock,
        fandubBlock,
        localizedPosterButton,
      ].map(async (elem) => (await elem())?.mount()),
    );
  }

  if (path && path.length >= 2) {
    (await aniBackground(mal_id, 'anime'))?.mount();
    usePageStore.getState().setMALId(mal_id);
  } else {
    usePageStore.getState().clearMALId();
  }
};

export default anime_page;
