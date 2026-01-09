import { ChevronsUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';
import MaterialSymbolsViewAgendaOutline from '~icons/material-symbols/view-agenda-outline';
import MaterialSymbolsViewColumn2Outline from '~icons/material-symbols/view-column-2-outline';
import { useReader } from '../../../hooks/use-reader';
import { MangaOrientation } from '../../../reader.enums';
import type {
  BaseReaderSettings,
  ReaderSettings as ReaderSettingsType,
} from '../../../reader.types';
import SwitchOption from '../_base/switch-option';

type SettingType = 'boolean' | 'number' | 'select' | 'tabs' | 'text';

interface SettingMetadata {
  label: string;
  type: SettingType;
  min?: number;
  max?: number;
  options?: {
    value: string;
    label?: string;
    icon?: React.ReactNode;
  }[];
}

type KeysOfUnion<T> = T extends T ? keyof T : never;
type BaseKeys = BaseReaderSettings | 'type';

const SETTINGS_CONFIG: Partial<
  Record<Exclude<KeysOfUnion<ReaderSettingsType>, BaseKeys>, SettingMetadata>
> = {
  // Manga
  scrollMode: { label: 'Режим скролу', type: 'boolean' },
  orientation: {
    label: 'Орієнтація',
    type: 'tabs',
    options: [
      {
        value: MangaOrientation.Horizontal,
        icon: <MaterialSymbolsViewColumn2Outline />,
      },
      {
        value: MangaOrientation.Vertical,
        icon: <MaterialSymbolsViewAgendaOutline />,
      },
    ],
  },
  // Novel
  fontFamily: {
    label: 'Шрифт',
    type: 'select',
    options: [
      { value: 'font-sans', label: 'Geist' },
      { value: 'font-inter', label: 'Inter' },
      { value: 'font-roboto', label: 'Roboto' },
      { value: 'font-literata', label: 'Literata' },
      { value: 'font-ebgaramond', label: 'EB Garamond' },
      { value: 'font-caveat', label: 'Caveat' },
    ],
  },
  // fontSize: { label: 'Font Size', type: 'number', min: 12, max: 72 },
};

const ReaderSettings = () => {
  const { container, settings, setSettings } = useReader();
  const { type, sortBy, fullscreen, ...dynamicFields } = settings;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="flex size-8 shrink-0 items-center justify-center">
                <MaterialSymbolsPageInfoOutlineRounded className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Налаштування</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="flex w-[--radix-dropdown-menu-trigger-width] min-w-56 flex-col gap-3 rounded-lg p-3"
            align="start"
            side="top"
            container={container}
          >
            {Object.entries(dynamicFields).map(([key, value]) => (
              <SettingItem
                key={key}
                settingKey={
                  key as Exclude<KeysOfUnion<ReaderSettingsType>, BaseKeys>
                }
                value={value}
                onChange={(newValue) => setSettings({ [key]: newValue })}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const SettingItem = ({
  settingKey,
  value,
  onChange,
}: {
  settingKey: Exclude<KeysOfUnion<ReaderSettingsType>, BaseKeys>;
  value: any;
  onChange: (val: any) => void;
}) => {
  const { container } = useReader();

  const config = SETTINGS_CONFIG[settingKey];
  if (!config) return; // Skip if no UI config exists

  return (
    <>
      {/*<span>{config.label}</span>*/}

      {config.type === 'boolean' && (
        <SwitchOption
          label={config.label}
          checked={value}
          onCheckedChange={onChange}
        />
      )}

      {config.type === 'tabs' && (
        <DropdownMenuGroup className="flex flex-col gap-3">
          <DropdownMenuLabel className="p-0">{config.label}</DropdownMenuLabel>
          <Tabs value={value} onValueChange={onChange}>
            <TabsList className="w-full bg-input">
              {config.options?.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="size-full p-0"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {option.label}
                  {option.icon}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </DropdownMenuGroup>
      )}

      {settingKey === 'fontFamily' && config.type === 'select' && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex flex-col justify-start text-left">
              <div className="text-muted-foreground text-xs">
                {config.label}
              </div>
              <div className="font-medium text-foreground text-sm">
                {
                  config.options?.find((option) => option.value === value)
                    ?.label
                }
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" container={container}>
            {config.options?.map((option, index) => (
              <>
                <DropdownMenuItem
                  key={option.value}
                  className="flex-col items-start gap-1 md:w-72"
                  onClick={(e) => {
                    e.preventDefault();
                    onChange(option.value);
                  }}
                >
                  <div className="font-medium text-muted-foreground text-xs">
                    {option.label}
                  </div>
                  <div className={cn(option.value)}>
                    Хікка любить Рікку та все таке. А потім щось цікаве
                    відбувається.
                  </div>
                </DropdownMenuItem>
                {config.options && index < config.options.length - 1 && (
                  <DropdownMenuSeparator />
                )}
              </>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/*{config.type === 'number' && (
        <input type="range" min={config.min} max={config.max} value={value}
               onChange={(e) => onChange(Number(e.target.value))} />
      )}

      {config.type === 'select' && (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {config.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}*/}
    </>
  );
};

export default ReaderSettings;
