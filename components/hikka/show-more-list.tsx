import { Children, type FC, type ReactNode } from 'react';
import MaterialSymbolsExpandMoreRounded from '~icons/material-symbols/expand-more-rounded';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Props {
  /** Rows shown before "show more". */
  shown: number;
  children: ReactNode;
}

/** Rows past the first few kept behind "Показати ще", as on hikka.io. */
const ShowMoreList: FC<Props> = ({ shown, children }) => {
  const rows = Children.toArray(children);
  const rest = rows.slice(shown);

  return (
    <Collapsible className="flex flex-col gap-1">
      {rows.slice(0, shown)}
      {rest.length > 0 && (
        <>
          {/*
           * Grows from 0px: its gap above is inside it, and the clip leaves
           * room for the rows' bleed (`-mx-2`) and focus ring.
           */}
          <CollapsibleContent className="-mt-1 h-(--collapsible-panel-height) transition-[height] duration-150 ease-out [clip-path:inset(0_-0.75rem_-0.25rem)] data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
            <div className="flex flex-col gap-1 pt-1">{rest}</div>
          </CollapsibleContent>
          <CollapsibleTrigger
            render={
              // Ghost without its open look, as on hikka.io.
              <Button
                variant={null}
                size="md"
                className="text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 w-full gap-2"
              />
            }
          >
            <MaterialSymbolsExpandMoreRounded className="transition-transform duration-150 ease-out group-data-panel-open/button:rotate-180 motion-reduce:transition-none" />
            <span className="group-data-panel-open/button:hidden">
              Показати ще {rest.length}
            </span>
            <span className="hidden group-data-panel-open/button:inline">
              Згорнути
            </span>
          </CollapsibleTrigger>
        </>
      )}
    </Collapsible>
  );
};

export default ShowMoreList;
