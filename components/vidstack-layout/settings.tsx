import {
  useAudioGainOptions,
  useMediaPlayer,
  usePlaybackRateOptions,
  useVideoQualityOptions,
} from '@vidstack/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/entrypoints/content/modules/player/context/player-context';
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

enum Views {
  Settings = 'settings',
  Quality = 'quality',
  PlaybackRate = 'playback-rate',
  AudioGain = 'audio-gain',
}

const MotionDropdownMenuGroup = motion.create(DropdownMenuGroup);

const Settings = () => {
  const { container } = usePlayer();
  const player = useMediaPlayer();
  const videoQualityOptions = useVideoQualityOptions();
  const currentQualityHeight = videoQualityOptions.selectedQuality?.height;
  const videoQualityHint =
    videoQualityOptions.selectedValue !== 'auto' && currentQualityHeight
      ? `${currentQualityHeight}p`
      : `Auto${currentQualityHeight ? ` (${currentQualityHeight}p)` : ''}`;

  const playbackRateOptions = usePlaybackRateOptions();
  const playbackRateHint =
    playbackRateOptions.selectedValue === '1'
      ? 'Normal'
      : `${playbackRateOptions.selectedValue}x`;

  const audioGainOptions = useAudioGainOptions();

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

  useEffect(() => {
    if (open) {
      player?.controls.pause();
    } else {
      player?.controls.resume();
    }
  }, [open]);

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
            className="z-10 parent-data-[open]:hidden px-2 py-0.5 font-medium text-sm"
            side="top"
            sideOffset={32}
            collisionBoundary={player?.el}
            collisionPadding={8}
          >
            Налаштування
          </TooltipContent>
        </Tooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent
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
                <DropdownMenuItem
                  disabled={videoQualityOptions.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    setView(Views.Quality);
                  }}
                >
                  Якість ({videoQualityHint})
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={playbackRateOptions.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    setView(Views.PlaybackRate);
                  }}
                >
                  Швидкість ({playbackRateHint})
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={audioGainOptions.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    setView(Views.AudioGain);
                  }}
                >
                  Audio Boost
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
                <DropdownMenuRadioGroup
                  value={videoQualityOptions.selectedValue}
                >
                  {videoQualityOptions.map(({ label, value, select }) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      onSelect={select}
                    >
                      {label}
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
                <DropdownMenuRadioGroup
                  value={playbackRateOptions.selectedValue}
                >
                  {playbackRateOptions.map(({ label, value, select }) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      onSelect={select}
                    >
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </MotionDropdownMenuGroup>
            )}

            {activeView === Views.AudioGain && (
              <MotionDropdownMenuGroup
                key="audio-gain"
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
                <DropdownMenuRadioGroup value={audioGainOptions.selectedValue}>
                  {audioGainOptions.map(({ label, value, select }) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      onSelect={select}
                    >
                      {label}
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
