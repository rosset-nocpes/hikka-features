import { useEffect, useState } from 'react';
import SwitchOption from '../_base/switch-option';

const AniButtonsSettings = () => {
  const [showAniButtons, toggleAniButtons] = useState<boolean | null>(null);

  const handleClick = () => {
    aniButtonsState.setValue(!showAniButtons);
    toggleAniButtons(!showAniButtons);
  };

  useEffect(() => {
    aniButtonsState.getValue().then((showAniButtons) => {
      toggleAniButtons(showAniButtons);
    });
  }, []);

  return (
    <SwitchOption
      label="Інші джерела"
      description="Додаткові посилання на сторінках тайтлів"
      checked={showAniButtons!}
      onClick={handleClick}
    />
  );
};

export default AniButtonsSettings;
