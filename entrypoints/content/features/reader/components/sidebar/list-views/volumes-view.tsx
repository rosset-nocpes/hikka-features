import { ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

import type { Chapter } from '../../../reader.types';

import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import {
  ReaderContentMode,
  ReaderOrderBy,
  ReaderSortBy,
} from '../../../reader.enums';

const isTranslatorMatch = (chapter: Chapter, translator: string) =>
  !translator ||
  chapter.translator
    .split(',')
    .map((value) => value.trim())
    .includes(translator);

const getDateTime = (value: string) =>
  new Date(value.split('.').reverse().join('-')).getTime();

const VolumesView = () => {
  const { currentChapter, settings, setChapter, getRead } = useReader();
  const { data } = useReadData();

  const currentChapterRef = useRef<HTMLButtonElement>(null);
  const [openVolumes, setOpenVolumes] = useState<Record<number, boolean>>(
    () => {
      const initial: Record<number, boolean> = {};
      if (data?.displayMode === ReaderContentMode.Volumes && data.volumes) {
        data.volumes.forEach((v) => {
          initial[v.number] = v.number === currentChapter?.volume;
        });
      }
      return initial;
    },
  );

  useEffect(() => {
    setOpenVolumes((prev) => ({
      ...prev,
      [currentChapter?.volume ?? 0]: true,
    }));
  }, [currentChapter?.volume]);

  const handleOpenChange = (volumeNumber: number, isOpen: boolean) => {
    setOpenVolumes((prev) => ({ ...prev, [volumeNumber]: isOpen }));
  };

  const handleSelectChapter = (value: Chapter) => {
    setChapter(value);
  };

  const sortedVolumes = useMemo(() => {
    if (data?.displayMode !== ReaderContentMode.Volumes) return [];

    const { field, order } = settings.sortBy;
    const multiplier = order === ReaderOrderBy.Ascending ? 1 : -1;

    return data.volumes
      .map((volume) => ({
        ...volume,
        chapters: volume.chapters
          .filter((chapter) => isTranslatorMatch(chapter, settings.translator))
          .sort((a, b) => {
            if (field === ReaderSortBy.Chapter) {
              return (a.chapter - b.chapter) * multiplier;
            }

            if (field === ReaderSortBy.DateUpload) {
              return (
                (getDateTime(a.date_upload) - getDateTime(b.date_upload)) *
                multiplier
              );
            }

            return 0;
          }),
      }))
      .filter((volume) => volume.chapters.length > 0)
      .sort((a, b) => {
        if (field === ReaderSortBy.Chapter) {
          return (a.number - b.number) * multiplier;
        }

        if (field === ReaderSortBy.DateUpload) {
          const dateA = getDateTime(a.chapters[0].date_upload);
          const dateB = getDateTime(b.chapters[0].date_upload);
          return (dateA - dateB) * multiplier;
        }

        return 0;
      });
  }, [data, settings.sortBy, settings.translator]);

  if (data?.displayMode !== ReaderContentMode.Volumes) return;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {sortedVolumes.map((volume) => (
          <Collapsible
            key={volume.number}
            open={openVolumes[volume.number]}
            render={<SidebarMenuItem />}
            onOpenChange={(isOpen) => handleOpenChange(volume.number, isOpen)}
            className="group/collapsible"
          >
            <CollapsibleTrigger
              render={
                <SidebarMenuButton
                  size="md"
                  className="group-data-[state=open]/collapsible:bg-sidebar-accent sticky top-0 z-10 font-medium duration-200 group-data-[state=open]/collapsible:rounded-b-none"
                >
                  <span>Том {volume.number}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              }
            />
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
              <SidebarMenuSub>
                {volume.chapters.map((chapter) => (
                  <SidebarMenuSubItem key={chapter.id}>
                    <SidebarMenuButton
                      onClick={() => handleSelectChapter(chapter)}
                      isActive={chapter.id === currentChapter?.id}
                      size="lg"
                      ref={
                        chapter.id === currentChapter?.id
                          ? currentChapterRef
                          : null
                      }
                    >
                      <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                        <span
                          className={cn(
                            (() => {
                              const allChapters = sortedVolumes.flatMap(
                                (vol) => vol.chapters,
                              );
                              const chapterIndex = allChapters.findIndex(
                                (chap) => chap.id === chapter.id,
                              );
                              return (
                                chapterIndex !== -1 &&
                                chapterIndex < getRead() &&
                                'text-muted-foreground'
                              );
                            })(),
                          )}
                        >
                          Розділ {chapter.chapter}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">
                            {chapter.date_upload}
                          </span>
                          {chapter.translator && (
                            <>
                              <div className="bg-muted-foreground size-1 shrink-0 rounded-full" />
                              <span className="text-muted-foreground truncate text-xs">
                                {chapter.translator}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default VolumesView;
