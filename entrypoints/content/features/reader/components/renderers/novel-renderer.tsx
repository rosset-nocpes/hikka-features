import parse, {
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useScroll,
} from 'motion/react';
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const NovelRenderer = () => {
  const { currentChapter, settings } = useReader();
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

  const htmlContent = useMemo(
    () =>
      chapterPage && !Array.isArray(chapterPage)
        ? parseNovelPage(chapterPage)
        : '',
    [chapterPage],
  );

  const handleAnimationStart = () => {
    setAnimationComplete(false);
  };

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  return (
    <>
      <motion.div
        id="scroll-indicator"
        className="absolute top-0 right-0 left-0 z-10 h-1 origin-left bg-primary"
        style={{
          scaleX: animationComplete && !isLoading ? scrollYProgress : 0,
        }}
      />

      <div
        className={cn(
          'flex w-full flex-1 justify-center overflow-y-auto bg-background px-3 text-foreground',
          settings.type === ReaderType.Novel && settings.fontFamily,
          settings.type === ReaderType.Novel && settings.theme,
        )}
        style={{
          fontSize:
            settings.type === ReaderType.Novel ? settings.fontSize : undefined,
        }}
      >
        <ScrollArea ref={scrollRef} className="w-full max-w-4xl">
          <div className="mt-48 mb-10 flex flex-col">
            {currentChapter?.title && (
              <p className="font-bold text-muted-foreground text-sm uppercase tracking-widest">
                {currentChapter?.volume && `Том ${currentChapter?.volume} `}
                Розділ {currentChapter?.chapter}
              </p>
            )}
            <h1 className="scroll-m-20 whitespace-nowrap text-balance font-extrabold text-4xl tracking-tight">
              {currentChapter?.title ||
                `${currentChapter?.volume ? `Том ${currentChapter?.volume} ` : ''}Розділ ${currentChapter?.chapter}`}
            </h1>
          </div>

          <AnimatePresence mode="wait">
            {chapterPage && !isLoading && (
              <PageParser
                htmlContent={htmlContent}
                onAnimationStart={handleAnimationStart}
                onAnimationComplete={handleAnimationComplete}
              />
            )}
            {isLoading && (
              <motion.div className="flex flex-col gap-4" {...layoutAnimation}>
                {Array.from({ length: 15 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full" />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </>
  );
};

interface PageParserProps extends HTMLMotionProps<'div'> {
  htmlContent: string;
}

const PageParser = memo(
  forwardRef<HTMLDivElement, PageParserProps>(
    ({ htmlContent, ...props }, ref) => {
      const { container } = useReader();

      const options: HTMLReactParserOptions = useMemo(
        () => ({
          replace: (domNode: any) => {
            if (domNode.name === 'img') {
              return (
                <ZoomableImage
                  src={domNode.attribs.src}
                  alt={domNode.attribs.alt}
                />
              );
            }

            if (domNode?.attribs?.class === 'hover-card-trigger') {
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
            return undefined;
          },
        }),
        [container],
      );

      const parsed = useMemo(
        () => parse(htmlContent, options),
        [htmlContent, options],
      );

      return (
        <motion.div
          className="[&_img]:rounded-md [&_img]:border [&_p:not(:first-child)]:mt-6 [&_p]:leading-7 [&_span]:inline"
          ref={ref}
          {...layoutAnimation}
          {...props}
        >
          {parsed}
        </motion.div>
      );
    },
  ),
);

interface ZoomableImageProps {
  src: string;
  alt?: string;
}

const ZoomableImage = ({ src, alt }: ZoomableImageProps) => {
  const [zoomed, setZoomed] = useState(false);
  const { container } = useReader();

  useEffect(() => {
    if (!zoomed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [zoomed]);

  return (
    <>
      <motion.img
        layoutId={src}
        src={src}
        alt={alt}
        className="cursor-zoom-in"
        onClick={() => setZoomed(true)}
      />
      {container &&
        createPortal(
          <AnimatePresence>
            {zoomed && (
              <motion.div
                initial={{ backgroundColor: 'hsl(var(--background) / 0)' }}
                animate={{ backgroundColor: 'hsl(var(--background) / 0.95)' }}
                exit={{ backgroundColor: 'hsl(var(--background) / 0)' }}
                className="absolute inset-0 z-[9999] flex cursor-zoom-out items-center justify-center"
                onClick={() => setZoomed(false)}
              >
                <motion.img
                  layoutId={src}
                  src={src}
                  alt={alt}
                  className="max-h-[90vh] max-w-[90vw] rounded-lg border"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          container,
        )}
    </>
  );
};

export default NovelRenderer;
