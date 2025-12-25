import { ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';
import MaterialSymbolsViewAgendaOutline from '~icons/material-symbols/view-agenda-outline';
import MaterialSymbolsViewColumn2Outline from '~icons/material-symbols/view-column-2-outline';
import { type ReaderState, useReaderContext } from '../context/reader-context';
import SwitchOption from './_base/switch-option';

const ReaderSettings = () => {
  const { container, scrollMode, setScrollMode, orientation, setOrientation } =
    useReaderContext();
  const { open: openSidebar } = useSidebar();

  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const triggerRef = useRef(null);

  const handleOrientationChange = (value: string) => {
    setOrientation(value as ReaderState['orientation']);
  };

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (
        open &&
        contentRef.current &&
        triggerRef.current &&
        !event.composedPath().includes(contentRef.current) &&
        !event.composedPath().includes(triggerRef.current)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" ref={triggerRef} />}
          >
            <div className="flex size-8 shrink-0 items-center justify-center">
              <MaterialSymbolsPageInfoOutlineRounded className="size-5!" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Налаштування</span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="flex min-w-56 flex-col gap-3 rounded-lg p-3"
            align={openSidebar ? 'start' : 'end'}
            side={openSidebar ? 'top' : 'left'}
            sideOffset={openSidebar ? 4 : 12}
            alignOffset={openSidebar ? 0 : -5}
            container={container}
            ref={contentRef}
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

export default ReaderSettings;
