import { ScrollArea } from '@/components/ui/scroll-area';

import SettingsGroup from '../_base/settings-group';
import SwitchOption from '../_base/switch-option';

const ReaderSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.reader;

  return (
    <ScrollArea className="flex-1" scrollFade>
      <div className="flex flex-col gap-3 pb-4">
        <SettingsGroup>
          <SwitchOption
            grouped
            checked={enabled}
            label="Кнопка читалки"
            description="Кнопка для відображення читалки"
            onClick={() => {
              updateFeatureSettings('reader', { enabled: !enabled });
            }}
          />
        </SettingsGroup>
      </div>
    </ScrollArea>
  );
};

export default ReaderSettings;
