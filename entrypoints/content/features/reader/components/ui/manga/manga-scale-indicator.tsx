import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReader } from '../../../hooks/use-reader';
import { ReaderType } from '../../../reader.enums';

const MangaScaleIndicator = () => {
  const { settings, setSettings } = useReader();

  if (settings.type !== ReaderType.Manga) return;

  const handleZoomIn = () => {
    setSettings({ scale: Math.min(settings.scale + 0.1, 1.4) });
  };

  const handleZoomOut = () => {
    setSettings({ scale: Math.max(settings.scale - 0.1, 0.8) });
  };

  return (
    <div
      className={cn(
        'absolute right-2 bottom-2 z-20 flex h-8 cursor-default items-center gap-2 rounded-md bg-sidebar px-1 font-medium duration-300',
        !settings.scrollMode && '-bottom-8',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={handleZoomOut}
      >
        <Minus className="size-4" />
      </Button>
      <div>{Math.round(settings.scale * 100)}%</div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-sm"
        onClick={handleZoomIn}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
};

export default MangaScaleIndicator;
