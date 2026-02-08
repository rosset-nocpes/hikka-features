import {
  Captions,
  Controls,
  Gesture,
  Thumbnail,
  Tooltip,
} from '@vidstack/react';
import { TooltipProvider } from '../ui/tooltip';
import BufferingIndicator from './buffering-indicator';
import * as Buttons from './buttons';
import * as Menus from './menus';
import * as Sliders from './sliders';
import { TimeGroup } from './time-group';
import { Title } from './title';
import VideoToolbar from './toolbar';

// Offset tooltips/menus/slider previews in the lower controls group so they're clearly visible.
const popupOffset = 30;

export interface VideoLayoutProps {
  thumbnails?: string;
}

export function VideoLayout({ thumbnails }: VideoLayoutProps) {
  return (
    <>
      <Gestures />
      <Captions className="absolute inset-0 bottom-2 media-controls:bottom-[85px] z-10 select-none break-words media-captions:opacity-100 media-preview:opacity-0 opacity-0 transition-[opacity,bottom] duration-300" />
      <BufferingIndicator />
      <Controls.Root className="absolute inset-0 z-10 flex h-full w-full flex-col bg-gradient-to-t from-black/10 to-transparent media-controls:opacity-100 opacity-0 transition-opacity duration-300">
        <TooltipProvider>
          <div className="flex-1" />
          <Controls.Group className="flex w-full items-center px-2">
            <Sliders.Time thumbnails={thumbnails} />
          </Controls.Group>
          <Controls.Group className="flex w-full items-center justify-between p-2">
            <VideoToolbar />
          </Controls.Group>
          {/* <Controls.Group className="-mt-0.5 flex w-full items-center px-2 pb-2">
            <Buttons.Play tooltipAlign="start" tooltipOffset={popupOffset} />
            <Buttons.Mute tooltipOffset={popupOffset} />
            <Sliders.Volume />
            <TimeGroup />
            <Title />
            <div className="flex-1" />
            <Menus.Captions offset={popupOffset} tooltipOffset={popupOffset} />
            <Buttons.PIP tooltipOffset={popupOffset} />
            <Buttons.Fullscreen
              tooltipAlign="end"
              tooltipOffset={popupOffset}
            />
          </Controls.Group> */}
        </TooltipProvider>
      </Controls.Root>
    </>
  );
}

function Gestures() {
  return (
    <>
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="pointerup"
        action="toggle:paused"
      />
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="dblpointerup"
        action="toggle:fullscreen"
      />
      <Gesture
        className="absolute top-0 left-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:-10"
      />
      <Gesture
        className="absolute top-0 right-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:10"
      />
    </>
  );
}
