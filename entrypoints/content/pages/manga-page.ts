import aniBackground from '../modules/ani-background';
import aniButtons from '../modules/ani-buttons';
import devButtons from '../modules/dev-buttons';
import readButton from '../modules/reader/readButton';
import recommendationBlock from '../modules/recommendation-block';

const manga_page = async () => {
  const path = usePageStore.getState().path;

  const mal_id = parseInt(
    (document.head.querySelector('[name=mal-id][content]') as HTMLMetaElement)
      ?.content,
  );

  if (path?.length === 2) {
    await prefetchHikkaManga();

    (await devButtons())?.mount();

    // readerButton
    (await readButton())?.mount();

    // aniButtons
    (await aniButtons())?.mount();

    // recommendationBlock
    (await recommendationBlock())?.mount();
  }

  // aniBackground
  if (path?.length! >= 2) {
    (await aniBackground(mal_id, 'manga'))?.mount();
    usePageStore.getState().setMALId(mal_id);
  } else {
    usePageStore.getState().clearMALId();
  }

  // actionRichPresence("remove");
};

export default manga_page;
