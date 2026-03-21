import mediaCover from '../features/media-cover/media-cover';
import readButton from '../features/reader/read-button';
import { ReaderType } from '../features/reader/reader.enums';
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
    (await mediaCover())?.mount();
    usePageStore.getState().setMALId(mal_id);
  } else {
    usePageStore.getState().clearMALId();
  }

  // actionRichPresence("remove");
};

export default manga_page;
