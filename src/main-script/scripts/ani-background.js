import { Transition } from 'solid-transition-group';
import { createSignal, onMount } from 'solid-js';
/* eslint-disable no-undef */
// @name        AniBackground
// @version     1.0.0
// @author      ~rosset-nocpes
// @description Adds background

export default function aniBackground(kitsuData, showAniBackground) {
  const cover = kitsuData.data[0].attributes.coverImage?.small;

  const [isLoaded, setIsLoaded] = createSignal(false);

  onMount(() => {
    const img = new Image();
    img.src = cover;

    img.onload = () => setIsLoaded(true);
  });

  return (
    <Transition name="slide">
      {showAniBackground() && isLoaded() && (
        <img
          id="cover"
          alt="cover"
          fetchpriority="high"
          decoding="async"
          data-nimg="fill"
          class="opacity-1 !transition relative size-full object-cover gradient-mask-b-0"
          style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
          sizes="100vw"
          src={cover}
        />
      )}
    </Transition>
  );
}
