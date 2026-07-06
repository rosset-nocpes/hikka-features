import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import SettingsGroup from '../_base/settings-group';
import SwitchOption from '../_base/switch-option';

const miniModeTypeOptions = [
  { value: 'custom', label: 'Кастомний' },
  { value: 'video-native', label: 'Нативний' },
];

const PlayerSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled, defaultProvider, disableBlur, miniModeType } =
    features.player;

  return (
    <ScrollArea className="flex-1" scrollFade>
      <div className="flex flex-col gap-3 pb-4">
        <SettingsGroup>
          <SwitchOption
            grouped
            checked={enabled}
            label="Кнопка перегляду"
            description="Кнопка для відображення програвача"
            onClick={() => {
              updateFeatureSettings('player', { enabled: !enabled });
            }}
          />
          <SwitchOption
            grouped
            checked={disableBlur}
            label="Вимкнути блюр"
            description="Прибирає розмиття фону в програвачі"
            onClick={() => {
              updateFeatureSettings('player', {
                disableBlur: !disableBlur,
              });
            }}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <label className="text-sm font-medium">Тип мінірежиму</label>
            {navigator.userAgent.toLowerCase().includes('firefox') ? (
              <select
                className="border-input bg-background placeholder:text-muted-foreground flex h-10 w-36 cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                value={miniModeType}
                onChange={(e) => {
                  updateFeatureSettings('player', {
                    miniModeType: e.target.value as 'custom' | 'video-native',
                  });
                }}
              >
                <option value="custom">Кастомний</option>
                <option value="video-native">Картинка в картинці</option>
              </select>
            ) : (
              <Select
                items={miniModeTypeOptions}
                value={miniModeType}
                onValueChange={(value) => {
                  updateFeatureSettings('player', {
                    miniModeType: value as 'custom' | 'video-native',
                  });
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Оберіть тип мінірежиму" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {miniModeTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <label className="text-sm font-medium">
              Програвач за замовчуванням
            </label>
            <Select
              value={defaultProvider}
              onValueChange={(value) => {
                if (!value) return;
                updateFeatureSettings('player', { defaultProvider: value });
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue
                  className="uppercase"
                  placeholder="Оберіть програвач за замовчуванням"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {['moon', 'ashdi'].map((elem) => (
                    <SelectItem className="uppercase" key={elem} value={elem}>
                      {elem}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </SettingsGroup>
      </div>
    </ScrollArea>
  );
};

export default PlayerSettings;
