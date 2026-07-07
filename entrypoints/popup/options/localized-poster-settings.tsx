import { ScrollArea } from '@/components/ui/scroll-area';

import SettingsGroup from '../_base/settings-group';
import SwitchOption from '../_base/switch-option';

const LocalizedPosterSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled, autoShow } = features.localizedPoster;

  return (
    <ScrollArea className="flex-1" scrollFade>
      <div className="flex flex-col gap-3 pb-4">
        <SettingsGroup>
          <SwitchOption
            grouped
            checked={enabled}
            label="Кнопка локалізації постера"
            onClick={() => {
              updateFeatureSettings('localizedPoster', { enabled: !enabled });
            }}
          />
          <SwitchOption
            grouped
            checked={autoShow}
            label="Автолокалізація постера"
            description="Автоматично замінює постер локалізованою версією"
            onClick={() => {
              updateFeatureSettings('localizedPoster', {
                autoShow: !autoShow,
              });
            }}
          />
        </SettingsGroup>
      </div>
    </ScrollArea>
  );
};

export default LocalizedPosterSettings;
