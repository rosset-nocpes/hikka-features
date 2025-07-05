import { ChevronsUpDown, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { useReaderContext } from '../context/reader-context';
import SwitchOption from './_base/switch-option';

const ReaderSettings = () => {
  const { container, scrollMode, setScrollMode, orientation, setOrientation } =
    useReaderContext();
  const { open } = useSidebar();

  const toggleScrollMode = () => {
    setScrollMode(!scrollMode);
  };

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <SidebarMenuButton size="lg">
          <div className="flex size-8 shrink-0 items-center justify-center">
            <Settings className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Налаштування</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-[--radix-popover-trigger-width] min-w-56 flex-col gap-2 rounded-lg"
        align="end"
        side={open ? 'top' : 'left'}
        sideOffset={open ? 4 : 16}
        container={container}
      >
        <SwitchOption
          label="Режим скролу"
          checked={scrollMode}
          onClick={toggleScrollMode}
        />
        <div className="flex items-center justify-between">
          <label className="font-medium text-sm">Орієнтація</label>
          <Select value={orientation} onValueChange={setOrientation}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Оберіть програвач за замовчуванням" />
            </SelectTrigger>
            <SelectContent container={container}>
              {['vertical', 'horizontal'].map((elem) => (
                <SelectItem key={elem} value={elem}>
                  {elem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* <div className="flex h-72 w-full items-center justify-center">WIP</div> */}
      </PopoverContent>
    </Popover>
  );
};

export default ReaderSettings;
