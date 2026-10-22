import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** The trigger's width. */
  width: string;
}

/** A settings row with a dropdown of `options`. */
function SelectOption<T extends string>({
  label,
  value,
  options,
  onChange,
  width,
}: Props<T>) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <label className="text-sm font-medium">{label}</label>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger className={width}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default SelectOption;
