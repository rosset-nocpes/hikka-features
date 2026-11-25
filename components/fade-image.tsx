import { type FC, useState } from 'react';

interface Layer {
  /** Its own, so an image shown again gets a fresh element that loads. */
  id: number;
  src: string;
  loaded: boolean;
}

interface Props {
  src?: string | null;
  alt?: string;
  /** For each image; it fills its parent, which positions and clips it. */
  className?: string;
  loading?: 'lazy' | 'eager';
}

let lastLayerId = 0;

const newLayer = (src: string): Layer => ({
  id: ++lastLayerId,
  src,
  loaded: false,
});

/**
 * The layers once `src` is to show: the images that loaded stay under the
 * new one while it loads, or show on their own when the top one is it. Two
 * of them: the top one may still be fading in over the one before.
 */
function layersFor(previous: Layer[], src: string | null | undefined) {
  if (!src) return [];
  const under = previous.filter((layer) => layer.loaded).slice(-2);
  return under.at(-1)?.src === src ? under : [...under, newLayer(src)];
}

/** Without a transition there's no `transitionend` to clear the ones under. */
const instant = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * An image that fades in once it has loaded, instead of popping in line by
 * line. When `src` changes (a poster giving way to a cover, the next track)
 * the new one fades in over the old, so nothing flashes empty.
 */
export const FadeImage: FC<Props> = ({
  src,
  alt = '',
  className,
  loading = 'lazy',
}) => {
  const [shownSrc, setShownSrc] = useState(src);
  const [layers, setLayers] = useState<Layer[]>(() => layersFor([], src));
  if (src !== shownSrc) {
    setShownSrc(src);
    setLayers((previous) => layersFor(previous, src));
  }

  /** Drops the layers under `id`, which now covers them. */
  const settle = (id: number) =>
    setLayers((current) => {
      const at = current.findIndex((layer) => layer.id === id);
      return at > 0 ? current.slice(at) : current;
    });

  return layers.map((layer) => (
    <img
      key={layer.id}
      src={layer.src}
      alt={alt}
      loading={loading}
      decoding="async"
      draggable={false}
      className={cn(
        'absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none',
        layer.loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
      onLoad={() => {
        setLayers((current) =>
          current.map((other) =>
            other.id === layer.id ? { ...other, loaded: true } : other,
          ),
        );
        if (instant()) settle(layer.id);
      }}
      onTransitionEnd={() => settle(layer.id)}
      // A broken image leaves the last one, or the parent's placeholder.
      onError={() =>
        setLayers((current) => current.filter((other) => other.id !== layer.id))
      }
    />
  ));
};
