import { ChevronsUpDown, Settings } from 'lucide-react';
import { FC } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';

interface Props {
  container: HTMLElement;
}

const ReaderSettings: FC<Props> = ({ container }) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg">
          <div className="flex size-8 shrink-0 items-center justify-center">
            <Settings className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Налаштування</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="top"
        container={container}
      >
        <div className="flex h-72 w-full items-center justify-center">WIP</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReaderSettings;
