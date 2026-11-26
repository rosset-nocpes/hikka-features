import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { motion, useReducedMotion } from 'motion/react';
import {
  Children,
  type FC,
  isValidElement,
  type PropsWithChildren,
  type ReactNode,
  useId,
} from 'react';
import MaterialSymbolsCheckRounded from '~icons/material-symbols/check-rounded';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import type { SettingOption } from '../../../reader.types';

/*
 * The reader's settings controls, laid out like the popup's settings rows.
 */

interface SectionProps extends PropsWithChildren {
  title: string;
}

/** A titled card of settings rows, divided by inset lines. */
export const Section: FC<SectionProps> = ({ title, children }) => {
  const rows = Children.toArray(children);
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground px-3 text-xs font-medium">
        {title}
      </h3>
      <div className="border-border/60 bg-foreground/[0.03] flex flex-col overflow-hidden rounded-xl border">
        {rows.map((row, index) =>
          index > 0 ? (
            <div
              key={isValidElement(row) ? row.key : index}
              className="before:bg-border/60 relative before:absolute before:inset-x-3 before:top-0 before:h-px"
            >
              {row}
            </div>
          ) : (
            row
          ),
        )}
      </div>
    </section>
  );
};

interface LabelProps {
  id?: string;
  label: string;
  description?: ReactNode;
  descriptionId?: string;
}

const RowLabel: FC<LabelProps> = ({
  id,
  label,
  description,
  descriptionId,
}) => (
  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
    <span id={id} className="text-sm leading-snug font-medium">
      {label}
    </span>
    {description && (
      <span
        id={descriptionId}
        className="text-muted-foreground text-xs leading-snug text-pretty"
      >
        {description}
      </span>
    )}
  </span>
);

interface SwitchRowProps {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** A row that toggles when clicked anywhere. */
export const SwitchRow: FC<SwitchRowProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
}) => {
  const id = useId();
  const descriptionId = useId();

  return (
    <div
      className="hover:bg-accent/40 flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2.5 transition-[background-color]"
      onClick={() => onCheckedChange(!checked)}
    >
      <RowLabel
        id={id}
        label={label}
        description={description}
        descriptionId={description ? descriptionId : undefined}
      />
      <Switch
        checked={checked}
        aria-labelledby={id}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={onCheckedChange}
        className="after:-inset-y-3"
      />
    </div>
  );
};

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onValueChange: (value: number) => void;
  /** Labels at the slider's ends, as the smallest and largest look. */
  start?: ReactNode;
  end?: ReactNode;
}

/** A labelled slider with its value shown at the right. */
export const SliderRow: FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  format,
  onValueChange,
  start,
  end,
}) => {
  const id = useId();

  return (
    <div className="flex flex-col gap-3 px-3 pt-2.5 pb-3.5">
      <div className="flex items-center justify-between gap-3">
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        <span className="text-muted-foreground text-xs font-medium tabular-nums">
          {format(value)}
        </span>
      </div>
      <div className="text-muted-foreground flex items-center gap-3">
        {start}
        <Slider
          aria-labelledby={id}
          min={min}
          max={max}
          step={step}
          // An array: a single number would give the slider two thumbs.
          value={[value]}
          onValueChange={(next) =>
            onValueChange(Array.isArray(next) ? next[0]! : next)
          }
        />
        {end}
      </div>
    </div>
  );
};

interface SegmentedRowProps<T extends string> {
  label: string;
  value: T;
  options: SettingOption<T>[];
  onValueChange: (value: T) => void;
}

/** A row picking one of a few options, all in view. */
export function SegmentedRow<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: SegmentedRowProps<T>) {
  const id = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2 px-3 pt-2.5 pb-3">
      <span id={id} className="text-sm font-medium">
        {label}
      </span>
      <RadioGroup<T>
        aria-labelledby={id}
        value={value}
        onValueChange={onValueChange}
        className="bg-background border-border/70 flex rounded-lg border p-0.5"
      >
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            className="text-muted-foreground hover:text-foreground data-checked:text-foreground focus-visible:ring-ring/50 relative flex-1 cursor-pointer rounded-md px-2 py-1 text-center text-xs font-medium transition-colors outline-none focus-visible:ring-2"
          >
            {option.value === value && (
              <motion.span
                layoutId={id}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', duration: 0.3, bounce: 0.1 }
                }
                className="bg-muted absolute inset-0 rounded-md shadow-sm"
              />
            )}
            <span className="relative">{option.label}</span>
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  );
}

interface TileOption<T extends string> extends SettingOption<T> {
  /** What the tile shows above its label, or in place of it. */
  preview: ReactNode;
  /** Classes of the tile's preview, as a theme's colours. */
  className?: string;
}

interface TilesProps<T extends string> {
  /** Names the group for screen readers, when nothing on screen does. */
  label: string;
  value: T;
  options: TileOption<T>[];
  onValueChange: (value: T) => void;
  /** Labels under the tiles, or only as their names, on smaller tiles. */
  showLabels?: boolean;
  className?: string;
}

/** Options as a row of tiles, each a picture of what it does. */
export function Tiles<T extends string>({
  label,
  value,
  options,
  onValueChange,
  showLabels = true,
  className,
}: TilesProps<T>) {
  return (
    <RadioGroup<T>
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className={cn('grid auto-cols-fr grid-flow-col gap-1.5', className)}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          aria-label={showLabels ? undefined : option.label}
          title={showLabels ? undefined : option.label}
          className={cn(
            'group/tile text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 data-checked:text-foreground flex cursor-pointer flex-col items-center gap-1.5 rounded-lg p-1 text-center transition-colors outline-none focus-visible:ring-2',
          )}
        >
          <span
            className={cn(
              'border-border/70 group-hover/tile:border-foreground/30 group-data-checked/tile:border-primary group-data-checked/tile:ring-primary/30 relative grid w-full place-items-center overflow-hidden rounded-lg border transition-[border-color,box-shadow] group-data-checked/tile:ring-2',
              showLabels ? 'h-12' : 'h-10',
              option.className ?? 'bg-background',
            )}
          >
            {option.preview}
          </span>
          {showLabels && (
            <span className="text-[11px] leading-tight font-medium text-balance">
              {option.label}
            </span>
          )}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}

interface OptionListProps<T extends string> {
  label: string;
  value: T;
  options: SettingOption<T>[];
  onValueChange: (value: T) => void;
  /** Classes of each option's label, as a font for its preview. */
  optionClassName?: (option: SettingOption<T>) => string;
}

/** Options as rows of a list, the picked one checked. */
export function OptionList<T extends string>({
  label,
  value,
  options,
  onValueChange,
  optionClassName,
}: OptionListProps<T>) {
  return (
    <RadioGroup<T>
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className="flex flex-col p-1"
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className="hover:bg-accent/40 focus-visible:ring-ring/50 data-checked:bg-accent/60 flex h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-left transition-[background-color] outline-none focus-visible:ring-2"
        >
          <span
            className={cn('truncate text-[15px]', optionClassName?.(option))}
          >
            {option.label}
          </span>
          <Radio.Indicator>
            <MaterialSymbolsCheckRounded className="text-primary size-4.5" />
          </Radio.Indicator>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
