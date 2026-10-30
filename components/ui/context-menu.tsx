import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';

import { resolvePositionMethod } from '@/utils/position-method';

/**
 * Opens on right click or a long press. Its items are the dropdown menu's
 * (`DropdownMenuItem` and the rest), which work in either.
 */
function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({ ...props }: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  );
}

function ContextMenuContent({
  className,
  container,
  collisionPadding = 8,
  positionMethod,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<
    ContextMenuPrimitive.Positioner.Props,
    'collisionPadding' | 'positionMethod'
  > &
  Pick<ContextMenuPrimitive.Portal.Props, 'container'>) {
  return (
    <ContextMenuPrimitive.Portal container={container}>
      <ContextMenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        collisionPadding={collisionPadding}
        positionMethod={resolvePositionMethod(container, positionMethod)}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn(
            'bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md p-1 shadow-md ring-1 duration-100 outline-none data-closed:overflow-hidden',
            className,
          )}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

export { ContextMenu, ContextMenuContent, ContextMenuTrigger };
