import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import MaterialSymbolsPageInfoOutlineRounded from '~icons/material-symbols/page-info-outline-rounded';
import { useReader } from '../../../hooks/use-reader';
import { READER_POWERED_BY, SETTINGS_CONFIG } from '../../../reader.constants';
import { ReaderType } from '../../../reader.enums';
import type {
  BaseKeys,
  KeysOfUnion,
  ReaderSettings as ReaderSettingsType,
} from '../../../reader.types';
import SwitchOption from '../_base/switch-option';

const ReaderSettings = () => {
  const { container, settings } = useReader();

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
            className="flex w-[--radix-dropdown-menu-trigger-width] min-w-56 flex-col gap-3 rounded-lg"
            align="start"
            side="top"
            container={container}
          >
            <SettingsItems />
            <div className="flex flex-col text-center text-muted-foreground text-xs">
              <DropdownMenuSeparator />
              <a
                href={READER_POWERED_BY[settings.type]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1"
              >
                {READER_POWERED_BY[settings.type]?.label}
              </a>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const SettingsItems = () => {
  const { settings, setSettings } = useReader();
  const { type, sortBy, fullscreen, ...dynamicFields } = settings;

  return (
    <div className="flex flex-col gap-3 p-3 pb-0">
      {Object.entries(dynamicFields).map(([key, value]) => (
        <SettingItem
          key={key}
          settingKey={key as Exclude<KeysOfUnion<ReaderSettingsType>, BaseKeys>}
          value={value}
          onChange={(newValue) => setSettings({ [key]: newValue })}
        />
      ))}
    </div>
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
  const { container, settings } = useReader();
  const { isMobile } = useSidebar();
  const config = SETTINGS_CONFIG[settingKey];

  if (!config) return null;

  const renderSetting = () => {
    switch (config.type) {
      case 'boolean':
        return (
          <SwitchOption
            label={config.label}
            checked={value}
            onCheckedChange={onChange}
          />
        );

      case 'tabs':
        return (
          <DropdownMenuGroup className="flex flex-col gap-2">
            <DropdownMenuLabel className="p-0">
              {config.label}
            </DropdownMenuLabel>
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
                    {option.icon && <option.icon />}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </DropdownMenuGroup>
        );

      case 'number':
        return (
          <Input
            type="number"
            min={config.min}
            max={config.max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        );

      case 'slider':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-xs">
                {config.label}
              </span>
              <span className="text-xs">{value}</span>
            </div>
            <Slider
              min={config.min}
              max={config.max}
              step={1}
              value={[value]}
              onValueChange={(val) => onChange(val[0])}
            />
          </div>
        );

      case 'select':
        return settingKey === 'fontFamily' ? (
          <FontFamilySelect
            config={config}
            value={value}
            onChange={onChange}
            container={container}
            isMobile={isMobile}
            fontFamily={
              settings.type === ReaderType.Novel
                ? settings.fontFamily
                : undefined
            }
          />
        ) : (
          <ThemeSelect config={config} value={value} onChange={onChange} />
        );

      default:
        return null;
    }
  };

  return renderSetting();
};

const FontFamilySelect = ({
  config,
  value,
  onChange,
  container,
  isMobile,
  fontFamily,
}: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="justify-between gap-4 pl-2">
        <div className="flex flex-col justify-start text-left">
          <div className="text-muted-foreground text-xs">{config.label}</div>
          <div className="font-medium text-foreground text-sm">
            {config.options?.find((opt: any) => opt.value === value)?.label}
          </div>
        </div>
        <div
          className={cn(
            'pointer-events-none flex size-4 select-none items-center justify-center text-base text-foreground',
            fontFamily,
          )}
        >
          Aa
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      side={isMobile ? 'bottom' : 'left'}
      align="end"
      sideOffset={isMobile ? 4 : 24}
      alignOffset={isMobile ? 0 : -12}
      container={container}
    >
      <ScrollArea
        className={cn(
          'max-h-80 w-full overflow-y-auto',
          isMobile && 'w-[--radix-dropdown-menu-trigger-width]',
        )}
      >
        {config.options?.map((option: any, index: number) => (
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
                Рікка після роботи йде гуляти з Хіккою.
              </div>
            </DropdownMenuItem>
            {index < config.options.length - 1 && <DropdownMenuSeparator />}
          </>
        ))}
      </ScrollArea>
    </DropdownMenuContent>
  </DropdownMenu>
);

const ThemeSelect = ({ config, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <span className="font-medium text-muted-foreground text-xs">
      {config.label}
    </span>
    <ButtonGroup className="w-full">
      {config.options?.map((option: any, index: number) => (
        <>
          <Button
            key={option.value}
            className={cn(
              'flex-1 items-center justify-center bg-background p-0',
              option.value,
            )}
            size="md"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              onChange(option.value);
            }}
          >
            {value === option.value && (
              <Check className="size-5 text-foreground" />
            )}
          </Button>
          {index < config.options.length - 1 && <ButtonGroupSeparator />}
        </>
      ))}
    </ButtonGroup>
  </div>
);

export default ReaderSettings;
