import { type FC, useEffect, useState } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';
import { useReaderContext } from './context/reader-context';

interface Props {
  carouselApi: CarouselApi;
}

const PageIndicator: FC<Props> = ({ carouselApi }) => {
  const { scrollMode, chapterImages } = useReaderContext();
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    const updateCurrentPage = () => {
      if (carouselApi.selectedScrollSnap() + 1 > chapterImages.length) return;

      setCurrentPage(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', updateCurrentPage);
    carouselApi.on('init', updateCurrentPage);

    return () => {
      carouselApi.off('select', updateCurrentPage);
      carouselApi.off('init', updateCurrentPage);
    };
  }, [carouselApi, chapterImages.length]);

  return (
    <div
      className={cn(
        'absolute bottom-2 left-2 z-20 flex h-8 cursor-default items-center gap-2 rounded-md bg-sidebar px-2 font-medium duration-300',
        scrollMode && '-bottom-8',
      )}
    >
      <div>{currentPage + 1}</div>
      <div className="h-full w-[2px] bg-muted" />
      <div>{chapterImages.length}</div>
    </div>
  );
};

export default PageIndicator;
