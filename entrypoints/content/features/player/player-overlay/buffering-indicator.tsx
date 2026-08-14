import { Spinner } from '@/components/ui/spinner';

const BufferingIndicator = () => {
  const { isBuffering } = useIFramePlayer();
  if (!isBuffering) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex h-full w-full items-center justify-center">
      <Spinner className="size-20" />
    </div>
  );
};

export default BufferingIndicator;
