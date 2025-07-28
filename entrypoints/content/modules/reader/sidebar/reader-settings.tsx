import { ChevronsUpDown, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaterialSymbolsViewAgendaOutline from '~icons/material-symbols/view-agenda-outline';
import MaterialSymbolsViewColumn2Outline from '~icons/material-symbols/view-column-2-outline';
import { useReaderContext } from '../context/reader-context';
import SwitchOption from './_base/switch-option';

const ReaderSettings = () => {
  const { container, scrollMode, setScrollMode, orientation, setOrientation } =
    useReaderContext();
  const { open } = useSidebar();

  const handleOrientationChange = (value: string) => {
    setOrientation(value);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
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
            className="flex w-[--radix-dropdown-menu-trigger-width] min-w-56 flex-col gap-3 rounded-lg p-3"
            align={open ? 'start' : 'end'}
            side={open ? 'top' : 'left'}
            sideOffset={open ? 4 : 12}
            alignOffset={open ? 0 : -5}
            container={container}
          >
            <DropdownMenuGroup className="flex flex-col gap-3">
              <DropdownMenuLabel className="p-0">Орієнтація</DropdownMenuLabel>
              <Tabs value={orientation} onValueChange={handleOrientationChange}>
                <TabsList className="w-full bg-input">
                  <TabsTrigger
                    value="vertical"
                    className="size-full p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <MaterialSymbolsViewAgendaOutline />
                  </TabsTrigger>
                  <TabsTrigger
                    value="horizontal"
                    className="size-full p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <MaterialSymbolsViewColumn2Outline />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="-mx-3 my-0 p-0" />
            <SwitchOption
              label="Режим скролу"
              checked={scrollMode}
              onCheckedChange={setScrollMode}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

// interface Props {
//   isOpenSettings: boolean;
//   setIsOpenSettings: React.Dispatch<React.SetStateAction<boolean>>;
// }

// const ReaderSettings: FC<Props> = ({ isOpenSettings, setIsOpenSettings }) => {
//   return (
//     <div
//       className={cn(
//         'relative h-full duration-300',
//         isOpenSettings ? 'w-80' : 'w-0',
//       )}
//     >
//       <div
//         className={cn(
//           'absolute left-full h-full w-80 rounded-md border bg-sidebar duration-300',
//           isOpenSettings ? 'left-0' : 'right-full',
//         )}
//       ></div>
//     </div>
//   );
// };

export default ReaderSettings;
