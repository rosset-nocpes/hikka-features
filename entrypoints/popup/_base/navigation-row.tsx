import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';

interface Props {
  label: string;
  description?: string;
  onClick: () => void;
}

const NavigationRow = ({ label, description, onClick }: Props) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/row hover:bg-accent/30 flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-[background-color]"
    >
      <div className="mr-10 flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs font-medium text-pretty text-[#A1A1A1]">
            {description}
          </span>
        )}
      </div>
      <MaterialSymbolsChevronRightRounded className="text-muted-foreground size-5 shrink-0 transition-transform group-hover/row:translate-x-0.5" />
    </button>
  );
};

export default NavigationRow;
