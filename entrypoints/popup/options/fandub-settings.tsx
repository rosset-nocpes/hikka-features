import SwitchOption from '../_base/switch-option';

const FandubSettings = () => {
  const [showFandubBlock, toggleFandubBlock] = useState<boolean | null>(null);

  const handleClick = () => {
    fandubBlockState.setValue(!showFandubBlock);
    toggleFandubBlock(!showFandubBlock);
  };

  useEffect(() => {
    fandubBlockState.getValue().then((showFandubBlock) => {
      toggleFandubBlock(showFandubBlock);
    });
  }, []);

  return (
    <SwitchOption
      checked={showFandubBlock!}
      label="Блок фандаб команд"
      description="Посилання на фандаб команди, які озвучили аніме тайтл"
      onClick={handleClick}
    />
  );
};

export default FandubSettings;
