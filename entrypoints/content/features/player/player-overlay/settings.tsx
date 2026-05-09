import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';

import { Button } from '@/components/ui/button';
import {
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenu,
} from '@/components/ui/dropdown-menu';
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from '@/components/ui/tooltip';
import { usePlayer } from '@/entrypoints/content/features/player/context/player-context';

enum Views {
  Settings = 'settings',
  Quality = 'quality',
  PlaybackRate = 'playback-rate',
  AudioGain = 'audio-gain',
}

const MotionDropdownMenuGroup = motion.create(DropdownMenuGroup);

const Settings = () => {
  const { container, overlayRef } = usePlayer();
  const {
    currentQuality,
    qualities,
    setCurrentQuality,
    currentSpeed,
    speedOptions,
    changeSpeed,
  } = useIFramePlayer();
  // const player = useMediaPlayer();
  // const videoQualityOptions = useVideoQualityOptions();
  // const currentQualityHeight = videoQualityOptions.selectedQuality?.height;
  // const videoQualityHint =
  //   videoQualityOptions.selectedValue !== 'auto' && currentQualityHeight
  //     ? `${currentQualityHeight}p`
  //     : `Auto${currentQualityHeight ? ` (${currentQualityHeight}p)` : ''}`;

  // const playbackRateOptions = usePlaybackRateOptions();
  // const playbackRateHint =
  //   playbackRateOptions.selectedValue === '1'
  //     ? 'Normal'
  //     : `${playbackRateOptions.selectedValue}x`;

  // const audioGainOptions = useAudioGainOptions();

  const [activeView, setView] = useState<Views>(Views.Settings);
  const [open, setOpen] = useState(false);
  const direction = activeView === Views.Settings ? -1 : 1;

  const menuVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MaterialSymbolsPageInfoOutlineRounded />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className="parent-data-[open]:hidden"
            side="top"
            sideOffset={32}
            collisionBoundary={overlayRef.current}
            collisionPadding={8}
          >
            Налаштування
          </TooltipContent>
        </Tooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-popover/60 backdrop-blur-xl"
        container={container}
        side="top"
        sideOffset={24}
        align="end"
        alignOffset={-40}
      >
        <motion.div
          layout
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            {activeView === Views.Settings && (
              <MotionDropdownMenuGroup
                key="main"
                custom={direction}
                variants={menuVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {currentQuality && (
                  <DropdownMenuItem
                    // disabled={videoQualityOptions.disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      setView(Views.Quality);
                    }}
                  >
                    Якість ({currentQuality})
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  // disabled={playbackRateOptions.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    browser.runtime.sendMessage({
                      type: 'playerjs-command',
                      api: 'qualities',
                    });
                    setView(Views.PlaybackRate);
                  }}
                >
                  Швидкість ({currentSpeed})
                </DropdownMenuItem>
              </MotionDropdownMenuGroup>
            )}
            {activeView === Views.Quality && (
              <MotionDropdownMenuGroup
                key="quality"
                custom={direction}
                variants={menuVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setView(Views.Settings);
                  }}
                >
                  {'< Налаштування'}
                </DropdownMenuItem>
                <DropdownMenuRadioGroup value={currentQuality}>
                  {qualities.toReversed().map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      onSelect={() => setCurrentQuality(value)}
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
                custom={direction}
                variants={menuVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setView(Views.Settings);
                  }}
                >
                  {'< Налаштування'}
                </DropdownMenuItem>
                <DropdownMenuRadioGroup value={currentSpeed.toString()}>
                  {speedOptions.map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value.toString()}
                      onSelect={() => changeSpeed(value)}
                    >
                      {value}
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
