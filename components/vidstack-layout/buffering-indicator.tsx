import { Spinner } from '../ui/spinner';

const BufferingIndicator = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex h-full w-full items-center justify-center">
      <Spinner
        className="size-20 media-buffering:opacity-100 opacity-0"
        style={{
          transition: 'opacity 0.2s linear',
        }}
      />
    </div>
  );
};

export default BufferingIndicator;
