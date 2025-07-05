import { Minus, Plus } from 'lucide-react';
import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { useReaderContext } from './context/reader-context';

interface Props {}

const ScaleIndicator: FC<Props> = ({}) => {
  const { scrollMode, scale, setScale } = useReaderContext();

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 1.4));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.8));
  };

  return (
    <div
      className={cn(
        'absolute right-2 bottom-2 z-20 flex h-8 cursor-default items-center gap-2 rounded-md bg-sidebar px-1 font-medium duration-300',
        !scrollMode && '-bottom-8',
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
      <div>{Math.round(scale * 100)}%</div>
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

export default ScaleIndicator;
