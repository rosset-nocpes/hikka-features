import { useCallback, useSyncExternalStore } from 'react';

import useReadChapterData from '../../../hooks/use-read-chapter-data';
import { useReader } from '../../../hooks/use-reader';
import { ReaderType } from '../../../reader.enums';

const MangaPageIndicator = () => {
  const { settings, carouselApi } = useReader();
  const { data } = useReadChapterData();
  const pageCount = Array.isArray(data) ? data.length : 0;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!carouselApi) return () => undefined;

      carouselApi.on('select', onStoreChange);
      carouselApi.on('reInit', onStoreChange);

      return () => {
        carouselApi.off('select', onStoreChange);
        carouselApi.off('reInit', onStoreChange);
      };
    },
    [carouselApi],
  );

  const getSnapshot = useCallback(() => {
    if (!carouselApi || pageCount === 0) return 0;

    return Math.min(carouselApi.selectedScrollSnap(), pageCount - 1);
  }, [carouselApi, pageCount]);

  const currentPage = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  if (settings.type !== ReaderType.Manga || pageCount === 0) return;

  return (
    <div
      className={cn(
        'bg-sidebar absolute bottom-2 left-2 z-20 flex h-8 cursor-default items-center gap-2 rounded-md px-2 font-medium duration-300',
        settings.scrollMode && '-bottom-8',
      )}
    >
      <div>{currentPage + 1}</div>
      <div className="bg-muted h-full w-[2px]" />
      <div>{pageCount}</div>
    </div>
  );
};

export default MangaPageIndicator;
