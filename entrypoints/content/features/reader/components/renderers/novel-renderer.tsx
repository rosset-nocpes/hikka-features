import parse, {
  type DOMNode,
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useScroll,
} from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import useReadChapterData from '../../hooks/use-read-chapter-data';
import { useReader } from '../../hooks/use-reader';
import { parseNovelPage } from '../../parse-novel-page';
import { FADE_BLUR, NOVEL_TEXT_WIDTHS } from '../../reader.constants';
import { ReaderType } from '../../reader.enums';
import ZoomableImage from '../ui/novel/zoomable-image';

/** Only rendered for novels. */
const NovelRenderer = () => {
  const { currentChapter, settings } = useReader(
    useShallow((state) => ({
      currentChapter: state.currentChapter,
      settings: state.settings,
    })),
  );
  const novel = settings.type === ReaderType.Novel ? settings : undefined;
  const { data: chapterPage, isLoading } = useReadChapterData();

  const [animationComplete, setAnimationComplete] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });

  useEffect(() => {
    if (!chapterPage || !animationComplete) return;
    scrollRef.current?.scrollTo({ top: 0 });

    // scroll event is dispatched to trigger progress bar update
    scrollRef.current?.dispatchEvent(new Event('scroll'));
  }, [animationComplete, chapterPage]);

  const contentHtml = useMemo(
    () =>
      chapterPage && !Array.isArray(chapterPage)
        ? parseNovelPage(chapterPage)
        : '',
    [chapterPage],
  );

  const label =
    currentChapter &&
    `${currentChapter.volume ? `Том ${currentChapter.volume} ` : ''}Розділ ${currentChapter.chapter}`;

  return (
    <>
      <motion.div
        id="scroll-indicator"
        className="bg-primary absolute top-0 right-0 left-0 z-20 h-1 origin-left"
        style={{
          scaleX: animationComplete && !isLoading ? scrollYProgress : 0,
        }}
      />

      <div
        className={cn(
          'bg-background text-foreground flex w-full flex-1 justify-center overflow-y-auto',
          novel?.fontFamily,
          novel?.theme,
        )}
        style={{ fontSize: novel?.fontSize }}
      >
        <ScrollArea
          ref={scrollRef}
          className="w-full [&_[data-slot=scroll-area-scrollbar]]:z-20"
        >
          <div
            lang="uk"
            className="mx-auto w-full px-5 md:px-8"
            style={{
              maxWidth: NOVEL_TEXT_WIDTHS.find(
                ({ value }) => value === novel?.textWidth,
              )?.maxWidth,
            }}
          >
            <div className="mt-24 mb-10 flex flex-col md:mt-48">
              {currentChapter?.title && (
                <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
                  {label}
                </p>
              )}
              <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
                {currentChapter?.title || label}
              </h1>
            </div>

            <AnimatePresence mode="wait">
              {chapterPage && !isLoading && (
                <PageParser
                  contentHtml={contentHtml}
                  className={cn(novel?.justify && 'text-justify hyphens-auto')}
                  style={{ lineHeight: novel?.lineHeight }}
                  onAnimationStart={() => setAnimationComplete(false)}
                  onAnimationComplete={() => setAnimationComplete(true)}
                />
              )}
              {isLoading && (
                <motion.div className="flex flex-col gap-4" {...FADE_BLUR}>
                  {Array.from({ length: 15 }).map((_, index) => (
                    <Skeleton key={index} className="h-4 w-full" />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

interface PageParserProps extends HTMLMotionProps<'div'> {
  contentHtml: string;
}

/** The chapter's text, with zoomable images and footnotes on hover. */
const PageParser = ({ contentHtml, className, ...props }: PageParserProps) => {
  const container = useReader((state) => state.container);

  const parsed = useMemo(() => {
    const options: HTMLReactParserOptions = {
      replace: (domNode: any) => {
        if (domNode.name === 'img') {
          return (
            <ZoomableImage
              src={domNode.attribs.src}
              alt={domNode.attribs.alt}
            />
          );
        }

        if (domNode.attribs?.class === 'hover-card-trigger') {
          return (
            <HoverCard>
              <HoverCardTrigger
                delay={200}
                closeDelay={100}
                render={
                  <span className="text-primary cursor-help underline decoration-dotted underline-offset-4">
                    {domToReact(domNode.children as DOMNode[])}
                  </span>
                }
              />

              <HoverCardContent className="w-80" container={container}>
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold">
                    {domNode.attribs['data-term']}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {domNode.attribs['data-definition']}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        }
        return undefined;
      },
    };
    return parse(contentHtml, options);
  }, [contentHtml, container]);

  return (
    <motion.div
      // Spacing in ems, so it grows with the text.
      className={cn(
        'mb-48 [&_img]:rounded-md [&_img]:border [&_p:not(:first-child)]:mt-[1.1em] [&_span]:inline',
        className,
      )}
      {...FADE_BLUR}
      {...props}
    >
      {parsed}
    </motion.div>
  );
};

export default NovelRenderer;
