import type { FC, PropsWithChildren } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';

/** A page of the popup, scrolling under its title. */
const SettingsPage: FC<PropsWithChildren> = ({ children }) => (
  <ScrollArea className="h-full" scrollFade>
    <div className="flex flex-col gap-3 pb-4">{children}</div>
  </ScrollArea>
);

export default SettingsPage;
