import type { FC } from 'react';

import { SidebarMenuButton } from '@/components/ui/sidebar';

import type { Chapter } from '../../../reader.types';

import { useReader } from '../../../hooks/use-reader';

interface Props {
  chapter: Chapter;
  /** Covered by the user's progress on hikka.io. */
  read: boolean;
  showVolume?: boolean;
}

/** A chapter of the reader's list: its number, upload date and translators. */
const ChapterRow: FC<Props> = ({ chapter, read, showVolume }) => {
  const { currentChapter, setChapter } = useReader();

  return (
    <SidebarMenuButton
      onClick={() => setChapter(chapter)}
      isActive={chapter.id === currentChapter?.id}
      size="lg"
    >
      <div className="flex flex-1 flex-col gap-1 truncate text-left leading-tight">
        <span className={cn(read && 'text-muted-foreground')}>
          {showVolume && chapter.volume ? `Том ${chapter.volume} ` : null}
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
  );
};

export default ChapterRow;
