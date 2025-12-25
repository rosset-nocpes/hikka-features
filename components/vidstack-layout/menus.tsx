import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useCaptionOptions, useMediaPlayer } from '@vidstack/react';
import { CheckCircle, CircleIcon, SubtitlesIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { buttonClass, tooltipClass } from './buttons';

export interface MenuProps {
  side?: DropdownMenuPrimitive.DropdownMenuContentProps['side'];
  align?: DropdownMenuPrimitive.DropdownMenuContentProps['align'];
  offset?: DropdownMenuPrimitive.DropdownMenuContentProps['sideOffset'];
  tooltipSide?: TooltipPrimitive.TooltipContentProps['side'];
  tooltipAlign?: TooltipPrimitive.TooltipContentProps['align'];
  tooltipOffset?: number;
}

// We can reuse this class for other menus.
const menuClass =
  'animate-out fade-out z-9999 slide-in-from-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-out-to-bottom-2 flex max-h-[400px] min-w-[260px] flex-col rounded-md border border-white/10 bg-black/95 p-2.5 font-sans text-[15px] font-medium outline-hidden backdrop-blur-xs duration-300';

export function Captions({
  side = 'top',
  align = 'end',
  offset = 0,
  tooltipSide = 'top',
  tooltipAlign = 'center',
  tooltipOffset = 0,
}: MenuProps) {
  const player = useMediaPlayer(),
    options = useCaptionOptions(),
    hint = options.selectedTrack?.label ?? 'Off';
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label="Settings"
            className={buttonClass}
            disabled={options.disabled}
          >
            <SubtitlesIcon className="h-7 w-7" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          className={tooltipClass}
          side={tooltipSide}
          align={tooltipAlign}
          sideOffset={tooltipOffset}
        >
          Captions
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className={menuClass}
        side={side}
        align={align}
        sideOffset={offset}
        collisionBoundary={player?.el}
      >
        <DropdownMenuLabel className="mb-2 flex w-full items-center px-1.5 font-medium text-[15px]">
          <SubtitlesIcon className="mr-1.5 h-5 w-5 translate-y-px" />
          Captions
          <span className="ml-auto text-sm text-white/50">{hint}</span>
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          aria-label="Captions"
          className="flex w-full flex-col"
          value={options.selectedValue}
        >
          {options.map(({ label, value, select }) => (
            <Radio value={value} onSelect={select} key={value}>
              {label}
            </Radio>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Radio({
  children,
  ...props
}: DropdownMenuPrimitive.DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuRadioItem
      className="group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm hocus:bg-white/10 p-2.5 text-sm outline-hidden ring-media-focus data-focus:ring-[3px]"
      {...props}
    >
      <CircleIcon className="h-4 w-4 text-white group-data-[state=checked]:hidden" />
      <CheckCircle className="hidden h-4 w-4 text-media-brand group-data-[state=checked]:block" />
      <span className="ml-2">{children}</span>
    </DropdownMenuRadioItem>
  );
}
