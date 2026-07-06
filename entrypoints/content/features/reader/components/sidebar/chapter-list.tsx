import { useRef } from 'react';

import { SidebarContent } from '@/components/ui/sidebar';

import useReadData from '../../hooks/use-read-data';
import { ReaderContentMode } from '../../reader.enums';
import ChaptersView from './list-views/chapters-view';
import VolumesView from './list-views/volumes-view';

const ChapterList = () => {
  const { data } = useReadData();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <SidebarContent
      ref={scrollRef}
      className="relative overflow-visible group-data-[collapsible=icon]:overflow-auto"
    >
      {data?.displayMode === ReaderContentMode.Chapters && (
        <ChaptersView scrollRef={scrollRef} />
      )}
      {data?.displayMode === ReaderContentMode.Volumes && <VolumesView />}
    </SidebarContent>
  );
};

export default ChapterList;
