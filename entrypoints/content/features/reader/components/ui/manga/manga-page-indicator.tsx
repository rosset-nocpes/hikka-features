import { useEffect, useState } from 'react';

import useReadChapterData from '../../../hooks/use-read-chapter-data';
import { useReader } from '../../../hooks/use-reader';
import { ReaderType } from '../../../reader.enums';

const MangaPageIndicator = () => {
  const { settings, carouselApi } = useReader();
  const { data } = useReadChapterData();
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!carouselApi || !Array.isArray(data)) return;

    const updateCurrentPage = () => {
      if (carouselApi.selectedScrollSnap() + 1 > data.length) return;

      setCurrentPage(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', updateCurrentPage);
    carouselApi.on('init', updateCurrentPage);

    return () => {
      carouselApi.off('select', updateCurrentPage);
      carouselApi.off('init', updateCurrentPage);
    };
  }, [carouselApi, data]);

  if (settings.type !== ReaderType.Manga || !Array.isArray(data)) return;

  return (
    <div
      className={cn(
        'bg-sidebar absolute bottom-2 left-2 z-20 flex h-8 cursor-default items-center gap-2 rounded-md px-2 font-medium duration-300',
        settings.scrollMode && '-bottom-8',
      )}
    >
      <div>{currentPage + 1}</div>
      <div className="bg-muted h-full w-[2px]" />
      <div>{data.length}</div>
    </div>
  );
};

export default MangaPageIndicator;
