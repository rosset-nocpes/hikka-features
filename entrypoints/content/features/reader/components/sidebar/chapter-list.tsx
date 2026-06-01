import { useEffect, useRef, useState } from 'react';

import { SidebarContent } from '@/components/ui/sidebar';

import useReadData from '../../hooks/use-read-data';
import { ReaderContentMode } from '../../reader.enums';
import ChaptersView from './list-views/chapters-view';
import VolumesView from './list-views/volumes-view';

const ChapterList = () => {
  const { data } = useReadData();
  const scrollRef = useRef<HTMLDivElement>(null);

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
      className="relative group-data-[collapsible=icon]:overflow-auto"
    >
      {data?.displayMode === ReaderContentMode.Chapters && (
        <ChaptersView scrollRef={scrollRef} />
      )}
      {data?.displayMode === ReaderContentMode.Volumes && <VolumesView />}
    </SidebarContent>
  );
};

export default ChapterList;
