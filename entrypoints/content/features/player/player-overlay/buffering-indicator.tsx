import { Spinner } from '@/components/ui/spinner';

const BufferingIndicator = () => {
  const { isBuffering } = useIFramePlayer();

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex h-full w-full items-center justify-center">
      <Spinner
        className={cn('size-20 opacity-0', isBuffering && 'opacity-100')}
        style={{
          transition: 'opacity 0.2s linear',
        }}
      />
    </div>
  );
};

export default BufferingIndicator;
