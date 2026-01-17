import readButton from '../features/reader/read-button';
import { ReaderType } from '../features/reader/reader.enums';
import aniBackground from '../modules/ani-background';
import aniButtons from '../modules/ani-buttons';
import devButtons from '../modules/dev-buttons';
import recommendationBlock from '../modules/recommendation-block';

const manga_page = async () => {
  const path = usePageStore.getState().path;

  const mal_id = getLocalMALId();

  if (path?.length === 2) {
    await prefetchHikkaManga();

    await Promise.allSettled(
      [
        devButtons(),
        readButton(ReaderType.Manga),
        aniButtons(),
        recommendationBlock(),
      ].map(async (elem) => (await elem)?.mount()),
    );
  }

  if (path?.length! >= 2) {
    (await aniBackground(mal_id, 'manga'))?.mount();
    usePageStore.getState().setMALId(mal_id);
  } else {
    usePageStore.getState().clearMALId();
  }

  // actionRichPresence("remove");
};

export default manga_page;
