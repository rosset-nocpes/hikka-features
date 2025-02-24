import SwitchOption from '../_base/switch-option';

const AniBackgroundSettings = () => {
  const [showAniBackground, toggleAniBackground] = useState<boolean | null>(
    null,
  );

  const handleClick = () => {
    aniBackState.setValue(!showAniBackground);
    toggleAniBackground(!showAniBackground);
  };

  useEffect(() => {
    aniBackState.getValue().then((showAniBackground) => {
      toggleAniBackground(showAniBackground);
    });
  }, []);

  return (
    <SwitchOption
      checked={showAniBackground!}
      label="Обкладинки"
      description="Покращене оформлення на сторінках тайтлів, персонажів та правок"
      onClick={handleClick}
    />
  );
};

export default AniBackgroundSettings;
