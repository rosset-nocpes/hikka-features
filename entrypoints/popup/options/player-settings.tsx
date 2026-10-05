import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigation } from '@/hooks/use-navigation';

import NavigationRow from '../_base/navigation-row';
import SettingsGroup from '../_base/settings-group';
import SwitchOption from '../_base/switch-option';

const miniModeTypeOptions = [
  { value: 'custom', label: 'Кастомний' },
  { value: 'video-native', label: 'Нативний' },
];

const PlayerSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled, defaultProvider, disableBlur, miniModeType, teamPriority } =
    features.player;
  const { navigate } = useNavigation();

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
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {miniModeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
              <SelectContent alignItemWithTrigger={false}>
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
          <NavigationRow
            label="Пріоритет команд"
            description={
              teamPriority.length
                ? teamPriority.map((team) => team.title).join(', ')
                : 'Яку команду обирати під час відкриття програвача'
            }
            onClick={() => navigate('teamPriority')}
          />
        </SettingsGroup>
      </div>
    </ScrollArea>
  );
};

export default PlayerSettings;
