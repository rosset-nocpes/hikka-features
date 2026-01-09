import { type FC, useEffect, useRef, useState } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';
import { SidebarContent } from '@/components/ui/sidebar';
import useReadData from '../../hooks/use-read-data';
import { ReaderContentMode } from '../../reader.enums';
import ChaptersView from './list-views/chapters-view';
import VolumesView from './list-views/volumes-view';

interface Props {
  carouselApi?: CarouselApi;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const ChapterList: FC<Props> = ({ carouselApi, scrollContainerRef }) => {
  const [isScrolled, setIsScrolled] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data } = useReadData();

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      setIsScrolled({
        top: element.scrollTop > 0,
        bottom: element.scrollTop + element.clientHeight < element.scrollHeight,
      });
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // useEffect(() => {
  //   if (!currentChapter || !mangaData) return;

  //   const currentIndex = mangaData.chapters.findIndex(
  //     (chapter) => chapter.id === currentChapter.id,
  //   );

  //   if (currentIndex !== -1) {
  //     rowVirtualizer.scrollToIndex(currentIndex, {
  //       align: 'center',
  //       behavior: 'auto',
  //     });
  //   }
  // }, [!!currentChapter]);

  // const sorted = useMemo(() => {
  //   if (!mangaData?.chapters) return [];

  //   const { field, order } = sortBy;
  //   const multiplier = order === 'asc' ? 1 : -1;

  //   return [...mangaData.chapters].sort((a, b) => {
  //     if (field === 'chapter') {
  //       return (a.chapter - b.chapter) * multiplier;
  //     }

  //     if (field === 'date_upload') {
  //       const dateA = new Date(
  //         a.date_upload.split('.').reverse().join('-'),
  //       ).getTime();
  //       const dateB = new Date(
  //         b.date_upload.split('.').reverse().join('-'),
  //       ).getTime();
  //       return (dateA - dateB) * multiplier;
  //     }

  //     return 0;
  //   });
  // }, [mangaData?.chapters, sortBy]);

  return (
    <SidebarContent
      ref={scrollRef}
      className={cn('group-data-[collapsible=icon]:overflow-auto', {
        'gradient-mask-t-90-d': isScrolled.top && isScrolled.bottom,
        'gradient-mask-t-90': isScrolled.top && !isScrolled.bottom,
        'gradient-mask-b-90': !isScrolled.top && isScrolled.bottom,
      })}
      style={{
        scrollbarWidth: 'none',
      }}
    >
      {data?.displayMode === ReaderContentMode.Chapters && (
        <ChaptersView scrollRef={scrollRef} />
      )}
      {data?.displayMode === ReaderContentMode.Volumes && <VolumesView />}
    </SidebarContent>
  );
};

export default ChapterList;
