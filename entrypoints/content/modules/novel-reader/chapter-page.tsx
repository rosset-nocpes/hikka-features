import DOMPurify from 'dompurify';
import { AnimatePresence, motion } from 'motion/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import useNovelChapterPage from '@/hooks/use-novel-chapter-data';
import { useNovelReader } from './context/novel-reader-context';
import NovelRenderer from './novel-renderer';

// todo: add progress bar for how far have been scrolled
const ChapterPage = () => {
  const { currentChapter } = useNovelReader();
  const { data: chapterPage, isLoading } = useNovelChapterPage();

  // todo: fix
  const layoutAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(16px)' },
    transition: { duration: 0.2 },
  };

  return (
    <div className="flex w-full justify-center overflow-y-auto">
      <ScrollArea className="w-full max-w-4xl">
        <div className="mt-48 mb-10 flex flex-col">
          <p className="font-bold text-muted-foreground text-sm uppercase tracking-widest">
            Том {currentChapter?.volume} Розділ {currentChapter?.chapter}
          </p>
          <h1 className="scroll-m-20 whitespace-nowrap text-balance font-extrabold text-4xl tracking-tight">
            {currentChapter?.title}
          </h1>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {chapterPage && !isLoading && (
            // <motion.div
            //   className="*:flex *:flex-col *:justify-center [&_p:not(:first-child)]:mt-6 [&_p]:leading-7"
            //   // biome-ignore lint/security/noDangerouslySetInnerHtml: using dompurify to sanitize html
            //   dangerouslySetInnerHTML={{
            //     __html: DOMPurify.sanitize(chapterPage, {
            //       FORBID_ATTR: ['class', 'style'],
            //     }),
            //   }}
            //   {...layoutAnimation}
            // />
            <NovelRenderer
              htmlContent={parseNovelWithAutoExplanations(chapterPage) || ''}
            />
          )}
          {isLoading && (
            <motion.div className="flex flex-col gap-4" {...layoutAnimation}>
              {Array.from({ length: 15 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};

export default ChapterPage;
