import { Check, ChevronsUpDown } from 'lucide-react';
import { Children, type FC, type PropsWithChildren } from 'react';
import MaterialSymbolsChevronRightRounded from '~icons/material-symbols/chevron-right-rounded';
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type {
  BaseKeys,
  KeysOfUnion,
  ReaderSettings as ReaderSettingsType,
  UISettingMetadata,
} from '../../../reader.types';

import { useReader } from '../../../hooks/use-reader';
import { READER_POWERED_BY, SETTINGS_CONFIG } from '../../../reader.constants';
import SettingRow from '../_base/setting-row';
import SwitchOption from '../_base/switch-option';

type SettingKey = Exclude<KeysOfUnion<ReaderSettingsType>, BaseKeys>;

const FONT_PREVIEW = 'Рікка після роботи йде гуляти з Хіккою.';

const ReaderSettings = () => {
  const { container } = useReader();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg">
                <div className="flex size-8 shrink-0 items-center justify-center">
                  <MaterialSymbolsPageInfoOutlineRounded className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Налаштування</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg p-2"
            align="start"
            side="top"
            container={container}
          >
            <SettingsItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

/** The reader's settings as a popup-style group, with the source credit. */
export const SettingsItems = () => {
  const { settings, setSettings } = useReader();
  const {
    type,
    sortBy: _sortBy,
    fullscreen: _fullscreen,
    translator: _translator,
    ...dynamicFields
  } = settings;
  const poweredBy = READER_POWERED_BY[type];

  return (
    <div className="flex flex-col gap-2">
      <SettingsGroup>
        {Object.entries(dynamicFields).map(([key, value]) => {
          const config = SETTINGS_CONFIG[key as SettingKey];
          if (!config) return null;

          return (
            <SettingItem
              key={key}
              settingKey={key as SettingKey}
              config={config}
              value={value}
              onChange={(newValue) => setSettings({ [key]: newValue })}
            />
          );
        })}
      </SettingsGroup>
      {poweredBy && (
        <a
          href={poweredBy.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground py-1 text-center text-xs font-medium transition-colors"
        >
          {poweredBy.label}
        </a>
      )}
    </div>
  );
};

const SettingsGroup: FC<PropsWithChildren> = ({ children }) => (
  <div className="border-border/50 bg-card/30 overflow-hidden rounded-lg border">
    {Children.toArray(children).map((child, index) =>
      index > 0 ? (
        <div key={index} className="border-border/50 border-t">
          {child}
        </div>
      ) : (
        child
      ),
    )}
  </div>
);

interface SettingItemProps {
  settingKey: SettingKey;
  config: UISettingMetadata;
  value: any;
  onChange: (val: any) => void;
}

const SettingItem = ({
  settingKey,
  config,
  value,
  onChange,
}: SettingItemProps) => {
  const { label, description } = config;

  switch (config.type) {
    case 'boolean':
      return (
        <SwitchOption
          label={label}
          description={description}
          checked={value}
          onCheckedChange={onChange}
        />
      );

    case 'tabs':
      return (
        <SettingRow label={label} description={description}>
          <Tabs value={value} onValueChange={onChange}>
            <TabsList className="bg-input h-8 shrink-0">
              {config.options?.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  aria-label={option.label}
                  title={option.label}
                  className="px-2"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {option.icon ? <option.icon /> : option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </SettingRow>
      );

    case 'number':
      return (
        <SettingRow label={label} description={description}>
          <Input
            type="number"
            className="w-20 shrink-0"
            min={config.min}
            max={config.max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </SettingRow>
      );

    case 'slider':
      return (
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm leading-none font-medium">{label}</span>
            <span className="text-muted-foreground text-xs font-medium tabular-nums">
              {value} px
            </span>
          </div>
          <Slider
            min={config.min}
            max={config.max}
            step={1}
            value={value}
            onValueChange={(val) => onChange(val)}
          />
        </div>
      );

    case 'select':
      return settingKey === 'fontFamily' ? (
        <FontFamilySelect config={config} value={value} onChange={onChange} />
      ) : (
        <ThemeSelect config={config} value={value} onChange={onChange} />
      );

    default:
      return null;
  }
};

interface SelectProps {
  config: UISettingMetadata;
  value: string;
  onChange: (val: string) => void;
}

const FontFamilySelect = ({ config, value, onChange }: SelectProps) => {
  const { container } = useReader();
  const { isMobile } = useSidebar();
  const current = config.options?.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="group/row hover:bg-accent/30 flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-[background-color]"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm leading-none font-medium">
                {config.label}
              </span>
              <span className="truncate text-xs font-medium text-[#A1A1A1]">
                {current?.label}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span
                className={cn(
                  'text-foreground pointer-events-none text-base select-none',
                  value,
                )}
              >
                Aa
              </span>
              <MaterialSymbolsChevronRightRounded className="text-muted-foreground size-5 transition-transform group-hover/row:translate-x-0.5" />
            </div>
          </button>
        }
      />
      <DropdownMenuContent
        className={cn('w-72 rounded-lg p-1', isMobile && 'w-(--anchor-width)')}
        side={isMobile ? 'bottom' : 'left'}
        align="end"
        sideOffset={isMobile ? 4 : 24}
        alignOffset={isMobile ? 0 : -12}
        container={container}
      >
        <ScrollArea className="max-h-80 w-full">
          <div className="flex flex-col gap-1">
            {config.options?.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  'flex-col items-start gap-1 rounded-md px-3 py-2',
                  option.value === value && 'bg-accent/50',
                )}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                }}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    {option.label}
                  </span>
                  {option.value === value && (
                    <Check className="text-foreground size-4" />
                  )}
                </div>
                <div className={cn('text-sm', option.value)}>
                  {FONT_PREVIEW}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ThemeSelect = ({ config, value, onChange }: SelectProps) => {
  const current = config.options?.find((option) => option.value === value);

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm leading-none font-medium">{config.label}</span>
        <span className="text-muted-foreground text-xs font-medium">
          {current?.label}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {config.options?.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={selected}
              title={option.label}
              className={cn(
                'focus-visible:ring-ring cursor-pointer rounded-md transition-[box-shadow] outline-none focus-visible:ring-2',
                selected && 'ring-primary ring-2',
              )}
              onClick={(e) => {
                e.preventDefault();
                onChange(option.value);
              }}
            >
              <span
                className={cn(
                  'bg-background text-foreground border-border/50 flex h-10 items-center justify-center rounded-md border text-sm font-medium',
                  option.value,
                )}
              >
                {selected ? <Check className="size-4" /> : 'Aa'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReaderSettings;
