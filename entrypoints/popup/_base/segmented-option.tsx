import type { ReactNode } from 'react';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

import RowIcon from './row-icon';
import RowLabel from './row-label';

interface Props<T extends string> {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  value: T;
  options: readonly { value: T; label: string }[];
  /** Whether the choice does anything now; tints the icon. */
  active?: boolean;
  /**
   * The options on a line of their own under the label, each as wide as
   * the next: for rows whose options leave the label too little room.
   */
  stacked?: boolean;
  onChange: (value: T) => void;
}

/** A settings row choosing one of a few `options`, all in view. */
function SegmentedOption<T extends string>({
  label,
  description,
  icon,
  value,
  options,
  active = true,
  stacked = false,
  onChange,
}: Props<T>) {
  const id = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();

  const group = (
    <RadioGroup<T>
      aria-labelledby={id}
      aria-describedby={description ? descriptionId : undefined}
      value={value}
      onValueChange={onChange}
      className={cn(
        'bg-background border-border/70 flex shrink-0 rounded-lg border p-0.5',
        stacked ? 'w-full' : 'ml-1',
      )}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            'text-muted-foreground hover:text-foreground data-checked:text-foreground focus-visible:ring-ring/50 relative cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2',
            stacked && 'flex-1',
          )}
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
  );

  const heading = (
    <>
      {icon && <RowIcon active={active}>{icon}</RowIcon>}
      <RowLabel
        id={id}
        descriptionId={description ? descriptionId : undefined}
        label={label}
        description={description}
      />
    </>
  );

  return stacked ? (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      <div className="flex items-center gap-3">{heading}</div>
      {group}
    </div>
  ) : (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      {heading}
      {group}
    </div>
  );
}

export default SegmentedOption;
