import { ChevronRight } from 'lucide-react';
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
import useReadData from '../../../hooks/use-read-data';
import { useReader } from '../../../hooks/use-reader';
import { ReaderContentMode } from '../../../reader.enums';
import type { Chapter } from '../../../reader.types';

const VolumesView = () => {
  const { currentChapter, setChapter } = useReader();
  const { data } = useReadData();

  const handleSelectChapter = (value: Chapter) => {
    setChapter(value);
  };

  if (data?.displayMode !== ReaderContentMode.Volumes) return;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {data.volumes.map((volume) => (
          <Collapsible
            key={volume.number}
            asChild
            defaultOpen={volume.number === currentChapter?.volume}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  size="md"
                  className="font-medium duration-200 group-data-[state=open]/collapsible:rounded-b-none group-data-[state=open]/collapsible:bg-sidebar-accent/50"
                >
                  <span>Том {volume.number}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <SidebarMenuSub>
                  {volume.chapters.map((chapter) => (
                    <SidebarMenuSubItem key={chapter.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectChapter(chapter)}
                        isActive={chapter.id === currentChapter?.id}
                        size="lg"
                        // ref={
                        //   chapter.chapter === currentChapter?.chapter
                        //     ? currentChapterRef
                        //     : null
                        // }
                      >
                        <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
                          <span
                            className={
                              cn()
                              // volume.index <= getRead() &&
                              //   "text-muted-foreground",
                            }
                          >
                            Розділ {chapter.chapter}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground text-xs">
                              {chapter.date_upload}
                            </span>
                            <div className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                            <span className="truncate text-muted-foreground text-xs">
                              {chapter.translator}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default VolumesView;
