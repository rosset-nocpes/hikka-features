import { Fragment, useMemo, useState } from 'react';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';

import MissingDivider from '@/components/missing-divider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { hikkaTracker } from '@/utils/hikka-tracker';

import { allChapters, missingBelow, sortVolumes } from '../../../chapters';
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import { ReaderContentMode, ReaderOrderBy } from '../../../reader.enums';
import ChapterRow from './chapter-row';

const VolumesView = () => {
  const { currentChapter, settings } = useReader();
  const { sortBy, translator } = settings;
  const { data } = useReadData();
  const volumes =
    data?.displayMode === ReaderContentMode.Volumes ? data.volumes : undefined;

  // The open chapter's volume opens with it; others stay as the user left them.
  const [openVolumes, setOpenVolumes] = useState<Record<number, boolean>>({});
  const currentVolume = currentChapter?.volume ?? 0;
  const [openedVolume, setOpenedVolume] = useState<number>();
  if (openedVolume !== currentVolume) {
    setOpenedVolume(currentVolume);
    setOpenVolumes((open) => ({ ...open, [currentVolume]: true }));
  }

  const sortedVolumes = useMemo(
    () => sortVolumes(volumes ?? [], sortBy, translator),
    [volumes, sortBy, translator],
  );

  const descending = sortBy.order !== ReaderOrderBy.Ascending;

  // Counted across volume boundaries, since some sources restart chapter
  // numbers per volume and others don't.
  const missingById = useMemo(() => {
    const chapters = sortedVolumes.flatMap((volume) => volume.chapters);
    const missingCounts = missingBelow(chapters, sortBy);
    return new Map(
      chapters.map((chapter, index) => [chapter.id, missingCounts[index]!]),
    );
  }, [sortedVolumes, sortBy]);

  // Progress counts chapters in reading order, whatever the list shows.
  const readingOrder = useMemo(
    () =>
      new Map(allChapters(data).map((chapter, index) => [chapter.id, index])),
    [data],
  );

  if (!volumes) return;
  const progress = hikkaTracker.progress;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {sortedVolumes.map((volume) => (
          <Collapsible
            key={volume.number}
            open={openVolumes[volume.number] ?? false}
            render={<SidebarMenuItem />}
            onOpenChange={(open) =>
              setOpenVolumes((volumes) => ({
                ...volumes,
                [volume.number]: open,
              }))
            }
            className="group/collapsible"
          >
            <CollapsibleTrigger
              render={
                <SidebarMenuButton
                  size="md"
                  className="group-data-open/collapsible:bg-sidebar-accent sticky top-0 z-10 font-medium duration-200 group-data-open/collapsible:rounded-b-none"
                >
                  <span>Том {volume.number}</span>
                  <MaterialSymbolsChevronRightRounded className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </SidebarMenuButton>
              }
            />
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
              <SidebarMenuSub>
                {volume.chapters.map((chapter) => {
                  const missing = missingById.get(chapter.id) ?? 0;
                  const divider = missing > 0 && (
                    <SidebarMenuSubItem>
                      <MissingDivider count={missing} noun="chapter" />
                    </SidebarMenuSubItem>
                  );

                  return (
                    <Fragment key={chapter.id}>
                      {!descending && divider}
                      <SidebarMenuSubItem>
                        <ChapterRow
                          chapter={chapter}
                          read={(readingOrder.get(chapter.id) ?? 0) < progress}
                        />
                      </SidebarMenuSubItem>
                      {descending && divider}
                    </Fragment>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default VolumesView;
