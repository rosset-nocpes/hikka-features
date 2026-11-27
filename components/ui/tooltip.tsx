import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import {
  type ReactElement,
  type ReactNode,
  type Ref,
  useRef,
  useState,
} from 'react';

import { resolvePositionMethod } from '@/utils/position-method';

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  container,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding,
  positionMethod,
  anchor,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    | 'align'
    | 'alignOffset'
    | 'side'
    | 'sideOffset'
    | 'collisionAvoidance'
    | 'collisionBoundary'
    | 'collisionPadding'
    | 'positionMethod'
    | 'anchor'
  > &
  Pick<TooltipPrimitive.Portal.Props, 'container'>) {
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={collisionAvoidance}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        positionMethod={resolvePositionMethod(container, positionMethod)}
        anchor={anchor}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'bg-tooltip text-tooltip-foreground data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-balance shadow-md has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm',
            className,
          )}
          {...props}
        >
          {children}
          {/*<TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />*/}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/**
 * The element a shadow root UI renders into, which carries its styles and
 * theme, for an element inside it; none on a page of its own (the popup).
 */
function shadowContainer(element: Element | null) {
  let top = element;
  while (top?.parentElement) top = top.parentElement;
  return top?.parentNode instanceof ShadowRoot
    ? (top as HTMLElement)
    : undefined;
}

type HintProps = Omit<
  TooltipPrimitive.Trigger.Props,
  'render' | 'children' | 'ref'
> &
  Pick<
    TooltipPrimitive.Positioner.Props,
    'side' | 'sideOffset' | 'align' | 'collisionPadding'
  > & {
    /** Nothing shows without one. */
    label?: ReactNode;
    /** Where the hint goes; by default the shadow root its trigger is in. */
    container?: HTMLElement | null;
    /** E.g. hikka.io's own look, for a trigger in its page. */
    popupClassName?: string;
    ref?: Ref<HTMLElement>;
    children: ReactElement;
  };

/**
 * A hover hint for `children`, in place of a native `title`. It names
 * nothing for screen readers, so icon-only triggers keep an `aria-label`.
 * Other props go to the trigger, so it can be another popup's `render`.
 */
function Hint({
  label,
  container,
  side,
  sideOffset,
  align,
  collisionPadding = 8,
  popupClassName,
  ref,
  children,
  ...props
}: HintProps) {
  const trigger = useRef<HTMLElement | null>(null);
  const [found, setFound] = useState<HTMLElement>();
  return (
    <Tooltip
      disabled={!label}
      onOpenChange={(open) => {
        if (open && !container) setFound(shadowContainer(trigger.current));
      }}
    >
      <TooltipTrigger
        {...props}
        ref={(element: HTMLElement | null) => {
          trigger.current = element;
          if (typeof ref === 'function') ref(element);
          else if (ref) ref.current = element;
        }}
        render={children}
      />
      {label && (
        <TooltipContent
          container={container ?? found}
          side={side}
          sideOffset={sideOffset}
          align={align}
          collisionPadding={collisionPadding}
          className={popupClassName}
        >
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Hint };
