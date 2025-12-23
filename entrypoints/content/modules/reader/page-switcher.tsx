import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { CarouselApi } from '@/components/ui/carousel';
import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsArrowUpwardRounded from '~icons/material-symbols/arrow-upward-rounded';
import { useReaderContext } from './context/reader-context';

interface Props {
  carouselApi: CarouselApi;
}

const PageSwitcher: FC<Props> = ({ carouselApi }) => {
  const { orientation, scrollMode } = useReaderContext();

  const handlePageUp = () => {
    carouselApi?.scrollPrev();
  };

  const handlePageDown = () => {
    carouselApi?.scrollNext();
  };

  return (
    <div
      className={cn(
        'absolute z-20 hidden w-8 cursor-default flex-col items-center justify-center gap-2 rounded-md bg-sidebar py-1 font-medium duration-300 md:flex',
        orientation === 'vertical' && 'bottom-1/2 left-2 translate-y-1/2',
        orientation === 'vertical' && scrollMode && '-left-8 opacity-0',
        orientation === 'horizontal' &&
          'bottom-2 left-1/2 -translate-x-1/2 translate-y-1/4 -rotate-90',
        orientation === 'horizontal' && scrollMode && '-bottom-8 opacity-0',
        !scrollMode && 'opacity-40 hover:opacity-100',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={handlePageUp}
      >
        <MaterialSymbolsArrowUpwardRounded />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={handlePageDown}
      >
        <MaterialSymbolsArrowDownwardRounded />
      </Button>
    </div>
  );
};

export default PageSwitcher;
