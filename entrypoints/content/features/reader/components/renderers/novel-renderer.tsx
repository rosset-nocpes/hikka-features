import parse, {
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import { AnimatePresence, motion } from 'motion/react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import useReadChapterData from '../../hooks/use-read-chapter-data';
import { useReader } from '../../hooks/use-reader';
import { ReaderType } from '../../reader.enums';

const layoutAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(16px)' },
  transition: { duration: 0.2 },
};

// todo: add progress bar for how far have been scrolled
const NovelRenderer = () => {
  const { currentChapter, settings } = useReader();
  const { data: chapterPage, isLoading } = useReadChapterData();

  if (Array.isArray(chapterPage)) return;

  return (
    <div
      className={cn(
        'flex w-full justify-center overflow-y-auto',
        // settings.type === ReaderType.Novel && settings.fontFamily,
      )}
    >
      <ScrollArea className="w-full max-w-4xl">
        <div className="mt-48 mb-10 flex flex-col">
          <p className="font-bold text-muted-foreground text-sm uppercase tracking-widest">
            Том {currentChapter?.volume} Розділ {currentChapter?.chapter}
          </p>
          <h1 className="scroll-m-20 whitespace-nowrap text-balance font-extrabold text-4xl tracking-tight">
            {currentChapter?.title}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {chapterPage && !isLoading && (
            <PageParser htmlContent={parseNovelPage(chapterPage) || ''} />
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

const PageParser = ({ htmlContent }: { htmlContent: string }) => {
  const { container } = useReader();

  const options: HTMLReactParserOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.attribs.class === 'hover-card-trigger') {
        const term = domNode.attribs['data-term'];
        const definition = domNode.attribs['data-definition'];

        return (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <span className="cursor-help text-primary underline decoration-dotted underline-offset-4">
                {domToReact(domNode.children)}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" container={container}>
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-sm">{term}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {definition}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    },
  };

  return (
    <motion.div
      className="[&_img]:rounded-md [&_img]:border [&_p:not(:first-child)]:mt-6 [&_p]:leading-7 [&_span]:inline"
      {...layoutAnimation}
    >
      {parse(htmlContent, options)}
    </motion.div>
  );
};

export default NovelRenderer;
