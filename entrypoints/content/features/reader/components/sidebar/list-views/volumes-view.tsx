import { ChevronRight } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';

import MissingDivider, { countMissing } from '@/components/missing-divider';
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
import { getHikkaProgress } from '@/utils/hikka-progress';

import { allChapters, sortVolumes } from '../../../chapters';
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import {
  ReaderContentMode,
  ReaderOrderBy,
  ReaderSortBy,
} from '../../../reader.enums';
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
  useEffect(() => {
    setOpenVolumes((open) => ({ ...open, [currentVolume]: true }));
  }, [currentVolume]);

  const sortedVolumes = useMemo(
    () => sortVolumes(volumes ?? [], sortBy, translator),
    [volumes, sortBy, translator],
  );

  const descending = sortBy.order !== ReaderOrderBy.Ascending;

  // Counted across volume boundaries, since some sources restart chapter
  // numbers per volume and others don't.
  const missingById = useMemo(() => {
    if (sortBy.field !== ReaderSortBy.Chapter) return new Map<string, number>();

    const chapters = sortedVolumes.flatMap((volume) => volume.chapters);
    return new Map(
      chapters.map((chapter, index) => {
        const below = chapters[descending ? index + 1 : index - 1];
        return [chapter.id, countMissing(chapter.chapter, below?.chapter)];
      }),
    );
  }, [sortedVolumes, sortBy.field, descending]);

  // Progress counts chapters in reading order, whatever the list shows.
  const readingOrder = useMemo(
    () =>
      new Map(allChapters(data).map((chapter, index) => [chapter.id, index])),
    [data],
  );

  if (!volumes) return;
  const progress = getHikkaProgress();

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
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
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
