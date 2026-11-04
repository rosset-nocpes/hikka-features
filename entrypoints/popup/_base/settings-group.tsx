import {
  Children,
  type FC,
  isValidElement,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

interface Props extends PropsWithChildren {
  title?: string;
  /** A note under the card. */
  footer?: ReactNode;
}

/** A card of settings rows, with an optional label above and note below. */
const SettingsGroup: FC<Props> = ({ title, footer, children }) => (
  <section className="flex flex-col gap-1.5">
    {title && (
      <h2 className="text-muted-foreground px-4 text-xs font-medium">
        {title}
      </h2>
    )}
    <div className="bg-card/70 border-border/70 flex flex-col overflow-hidden rounded-xl border">
      {/* toArray drops conditional rows, so no divider hangs off an empty one. */}
      {Children.toArray(children).map((child, index) =>
        index > 0 ? (
          <div
            key={isValidElement(child) ? child.key : index}
            className="before:bg-border/70 relative before:absolute before:inset-x-4 before:top-0 before:h-px"
          >
            {child}
          </div>
        ) : (
          child
        ),
      )}
    </div>
    {footer && (
      <p className="text-muted-foreground px-4 text-xs leading-snug text-pretty">
        {footer}
      </p>
    )}
  </section>
);

export default SettingsGroup;
