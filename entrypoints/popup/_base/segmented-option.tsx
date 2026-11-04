import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

import RowLabel from './row-label';

interface Props<T extends string> {
  label: string;
  description?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A settings row choosing one of a few `options`, all in view. */
function SegmentedOption<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: Props<T>) {
  const id = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      <RowLabel id={id} label={label} description={description} />
      <RadioGroup<T>
        aria-labelledby={id}
        value={value}
        onValueChange={onChange}
        className="bg-background border-border/70 ml-1 flex shrink-0 rounded-lg border p-0.5"
      >
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            className="text-muted-foreground hover:text-foreground data-checked:text-foreground focus-visible:ring-ring/50 relative cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2"
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

export default SegmentedOption;
