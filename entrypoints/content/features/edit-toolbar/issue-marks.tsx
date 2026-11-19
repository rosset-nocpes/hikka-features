import { type FC, useEffect, useMemo, useRef, useState } from 'react';

import { Tooltip, TooltipContent } from '@/components/ui/tooltip';

import type { CheckedEditField } from './use-edit-page';

import { FieldMarks } from './field-marks';

type Hovered = NonNullable<ReturnType<FieldMarks['at']>>;

const sameHover = (a?: Hovered, b?: Hovered) =>
  a === b ||
  (!!a &&
    !!b &&
    a.range === b.range &&
    a.index === b.index &&
    a.issues.length === b.issues.length &&
    a.issues.every(
      ({ issue, text }, index) =>
        issue === b.issues[index]?.issue && text === b.issues[index]?.text,
    ));

/**
 * The fields' issues marked right in their text, each saying on hover which
 * rule it breaks.
 */
const IssueMarks: FC<{
  fields: CheckedEditField[];
  container: HTMLElement;
}> = ({ fields, container }) => {
  const marks = useRef<FieldMarks>(undefined);
  const pointer = useRef<{ x: number; y: number }>(undefined);
  const [hovered, setHovered] = useState<Hovered>();
  // Kept while the tooltip fades out.
  const [shown, setShown] = useState<Hovered>();
  if (hovered && hovered !== shown) setShown(hovered);

  const hover = () => {
    const at = pointer.current;
    const found = at && marks.current?.at(at.x, at.y);
    setHovered((previous) => (sameHover(previous, found) ? previous : found));
  };

  useEffect(() => {
    const fieldMarks = new FieldMarks();
    marks.current = fieldMarks;
    if (!fieldMarks.enabled) return;

    let frame = 0;
    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(hover);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.current = undefined;
      hover();
    };
    // The mirrors keep up with their inputs at once, before the frame paints.
    const onMove = () => {
      fieldMarks.sync();
      hover();
    };
    const options = { capture: true, passive: true };
    document.addEventListener('pointermove', onPointerMove, options);
    document.addEventListener('pointerout', onPointerOut, options);
    document.addEventListener('scroll', onMove, options);
    document.addEventListener('input', onMove, options);
    window.addEventListener('resize', onMove, options);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onPointerMove, options);
      document.removeEventListener('pointerout', onPointerOut, options);
      document.removeEventListener('scroll', onMove, options);
      document.removeEventListener('input', onMove, options);
      window.removeEventListener('resize', onMove, options);
      fieldMarks.destroy();
      marks.current = undefined;
    };
  }, []);

  useEffect(() => {
    marks.current?.update(fields);
    hover();
  }, [fields]);

  // The piece of text under the pointer, wherever it's scrolled to since.
  const anchor = useMemo(
    () =>
      shown && {
        getBoundingClientRect: () =>
          shown.range.getClientRects()[shown.index] ??
          shown.range.getBoundingClientRect(),
      },
    [shown],
  );

  return (
    <Tooltip open={!!hovered}>
      <TooltipContent
        container={container}
        anchor={anchor}
        side="top"
        sideOffset={6}
        collisionPadding={8}
        className="pointer-events-none flex-col items-start gap-1 text-left"
      >
        {shown?.issues.map(({ issue, text }) => (
          <span key={issue.rule}>{text}</span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
};

export default IssueMarks;
