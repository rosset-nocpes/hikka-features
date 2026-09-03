import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import MaterialSymbolsArrowBackRounded from '~icons/material-symbols/arrow-back-rounded';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsHighQualityOutlineRounded from '~icons/material-symbols/high-quality-outline-rounded';
import MaterialSymbolsSettingsOutlineRounded from '~icons/material-symbols/settings-outline-rounded';
import MaterialSymbolsSpeedOutlineRounded from '~icons/material-symbols/speed-outline-rounded';
import MaterialSymbolsSubtitlesOutlineRounded from '~icons/material-symbols/subtitles-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenu,
} from '@/components/ui/dropdown-menu';
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from '@/components/ui/tooltip';
import { usePlayer } from '@/entrypoints/content/features/player/context/player-context';

enum Views {
  Root = 'root',
  Quality = 'quality',
  Subtitles = 'subtitles',
  PlaybackRate = 'playback-rate',
}

const MotionDropdownMenuGroup = motion.create(DropdownMenuGroup);

const EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1] as const;

const sizeTransition = { duration: 0.25, ease: EASE_SMOOTH_OUT } as const;

const menuVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 56 : -56,
    opacity: 0,
    filter: 'blur(3px)',
  }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (direction: number) => ({
    x: direction > 0 ? -56 : 56,
    opacity: 0,
    filter: 'blur(3px)',
    transition: {
      x: { duration: 0.15, ease: EASE_SMOOTH_OUT },
      filter: { duration: 0.1 },
      opacity: { duration: 0.1 },
    },
  }),
};

const viewMotionProps = (direction: number) => ({
  custom: direction,
  variants: menuVariants,
  initial: 'enter' as const,
  animate: 'center' as const,
  exit: 'exit' as const,
  transition: {
    x: { duration: 0.25, ease: EASE_SMOOTH_OUT },
    filter: { duration: 0.2 },
    opacity: { duration: 0.2 },
  },
});

const formatSpeed = (speed: number) => (speed === 1 ? 'Звичайна' : `${speed}x`);

const SubmenuHeader = ({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) => (
  <>
    <DropdownMenuItem
      className="text-muted-foreground font-medium"
      onClick={onBack}
      closeOnClick={false}
    >
      <MaterialSymbolsArrowBackRounded />
      {title}
    </DropdownMenuItem>
    <DropdownMenuSeparator />
  </>
);

const RowValue = ({ value }: { value: string }) => (
  <span className="text-muted-foreground ml-auto line-clamp-1 flex items-center gap-0.5 truncate text-xs tabular-nums">
    {value}
    <MaterialSymbolsChevronRightRounded className="size-4" />
  </span>
);

const Settings = () => {
  const { container, overlayRef } = usePlayer();
  const {
    currentQuality,
    qualities,
    setCurrentQuality,
    currentSpeed,
    speedOptions,
    changeSpeed,
    currentSubtitle,
    setCurrentSubtitle,
    subtitles,
  } = useIFramePlayer();

  const [activeView, setView] = useState<Views>(Views.Root);
  const [open, setOpen] = useState(false);
  const direction = activeView === Views.Root ? -1 : 1;

  // Track the natural size of the active view so the popup can smoothly
  // animate its width/height between views (the `layout` prop can't do
  // this reliably across AnimatePresence mounts/unmounts)
  const [viewSize, setViewSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const viewObserver = useRef<ResizeObserver | null>(null);

  const measureView = useCallback((node: HTMLElement | null) => {
    // Ignore unmount calls (exiting views): by that point the observer
    // is already watching the entering view and must not be disconnected
    if (!node) return;
    viewObserver.current ??= new ResizeObserver((entries) => {
      const target = entries.at(-1)?.target as HTMLElement | undefined;
      if (!target || !target.isConnected) return;
      setViewSize({ width: target.offsetWidth, height: target.offsetHeight });
    });
    viewObserver.current.disconnect();
    viewObserver.current.observe(node);
  }, []);

  useEffect(() => () => viewObserver.current?.disconnect(), []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    // Keep the player UI visible while the menu is open
    useIFramePlayer.setState({ uiLocked: nextOpen, uiShown: true });
    // Always start from the root view on open, so a previously
    // visited submenu doesn't greet the user on reopen. Drop the stale
    // measured size so the popup opens at its natural size
    if (nextOpen) {
      setView(Views.Root);
      setViewSize(null);
    }
  };

  const goBack = () => setView(Views.Root);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <MaterialSymbolsSettingsOutlineRounded
                    className={cn(
                      'size-5 transition-transform duration-200',
                      open && 'rotate-45',
                    )}
                  />
                </Button>
              }
            />
          }
        />
        {!open && (
          <TooltipContent
            side="top"
            sideOffset={32}
            collisionBoundary={overlayRef.current as Element}
            collisionPadding={8}
            container={container}
          >
            Налаштування
          </TooltipContent>
        )}
      </Tooltip>
      <DropdownMenuContent
        className="bg-popover/60 w-auto backdrop-blur-xl"
        container={container}
        side="top"
        sideOffset={24}
        align="end"
        alignOffset={-111}
        collisionBoundary={overlayRef.current as Element}
        collisionPadding={8}
      >
        <motion.div
          initial={false}
          animate={viewSize ?? undefined}
          transition={sizeTransition}
          className="relative overflow-hidden"
        >
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            {activeView === Views.Root && (
              <MotionDropdownMenuGroup
                key="root"
                ref={measureView}
                className="w-56"
                {...viewMotionProps(direction)}
              >
                {qualities.length > 0 && (
                  <DropdownMenuItem
                    onClick={() => setView(Views.Quality)}
                    closeOnClick={false}
                  >
                    <MaterialSymbolsHighQualityOutlineRounded />
                    Якість
                    <RowValue value={currentQuality || 'Авто'} />
                  </DropdownMenuItem>
                )}
                {subtitles.length > 0 && (
                  <DropdownMenuItem
                    onClick={() => setView(Views.Subtitles)}
                    closeOnClick={false}
                  >
                    <MaterialSymbolsSubtitlesOutlineRounded />
                    Субтитри
                    <RowValue value={currentSubtitle || 'Вимк.'} />
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setView(Views.PlaybackRate)}
                  closeOnClick={false}
                >
                  <MaterialSymbolsSpeedOutlineRounded />
                  Швидкість
                  <RowValue value={formatSpeed(currentSpeed)} />
                </DropdownMenuItem>
              </MotionDropdownMenuGroup>
            )}

            {activeView === Views.Quality && (
              <MotionDropdownMenuGroup
                key="quality"
                ref={measureView}
                className="w-44"
                {...viewMotionProps(direction)}
              >
                <SubmenuHeader title="Якість" onBack={goBack} />
                <DropdownMenuRadioGroup
                  value={currentQuality}
                  onValueChange={(value) => {
                    setCurrentQuality(value as string);
                    goBack();
                  }}
                >
                  {qualities.toReversed().map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      closeOnClick={false}
                      className="tabular-nums"
                    >
                      {value}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </MotionDropdownMenuGroup>
            )}

            {activeView === Views.Subtitles && (
              <MotionDropdownMenuGroup
                key="subtitles"
                ref={measureView}
                className="w-44"
                {...viewMotionProps(direction)}
              >
                <SubmenuHeader title="Субтитри" onBack={goBack} />
                <DropdownMenuRadioGroup
                  value={currentSubtitle}
                  onValueChange={(value) => {
                    setCurrentSubtitle(value as string);
                    goBack();
                  }}
                >
                  <DropdownMenuRadioItem value="" closeOnClick={false}>
                    Вимк.
                  </DropdownMenuRadioItem>
                  {subtitles.map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      closeOnClick={false}
                    >
                      {value}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </MotionDropdownMenuGroup>
            )}

            {activeView === Views.PlaybackRate && (
              <MotionDropdownMenuGroup
                key="playback-rate"
                ref={measureView}
                className="w-44"
                {...viewMotionProps(direction)}
              >
                <SubmenuHeader title="Швидкість" onBack={goBack} />
                <DropdownMenuRadioGroup
                  value={currentSpeed}
                  onValueChange={(value) => {
                    changeSpeed(value as number);
                    goBack();
                  }}
                >
                  {speedOptions.map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      closeOnClick={false}
                      className="tabular-nums"
                    >
                      {formatSpeed(value)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </MotionDropdownMenuGroup>
            )}
          </AnimatePresence>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Settings;
