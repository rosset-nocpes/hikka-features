import {
  Children,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

interface Props extends PropsWithChildren {
  title?: string;
  icon?: ReactNode;
}

const SettingsGroup: FC<Props> = ({ title, icon, children }) => {
  return (
    <div className="border-border/50 bg-card/30 overflow-hidden rounded-lg border">
      {title && (
        <div className="text-muted-foreground border-border/50 flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold tracking-wider uppercase">
          {icon}
          {title}
        </div>
      )}
      <div className="flex flex-col">
        {Children.map(children, (child, index) =>
          index > 0 ? (
            <div className="border-border/50 border-t">{child}</div>
          ) : (
            child
          ),
        )}
      </div>
    </div>
  );
};

export default SettingsGroup;
