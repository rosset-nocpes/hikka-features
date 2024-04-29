import { createSignal } from 'solid-js';
/* eslint-disable no-undef */
// @name        AniBackground
// @version     1.0.0
// @author      ~rosset-nocpes
// @description Adds background

export default function aniBackground(kitsuData) {
  const [isLoaded, setIsLoaded] = createSignal(false);

  const handleImageLoad = () => setIsLoaded(true);
  const cover = kitsuData.data[0].attributes.coverImage.small;

  document
    .getElementsByTagName('head')[0]
    .insertAdjacentHTML(
      'beforeend',
      `<link rel="preload" as="image" href="${cover}" fetchpriority="high">`,
    );

  return (
    <img
      id={isLoaded ? 'cover' : ''}
      onLoad={handleImageLoad}
      alt="cover"
      fetchpriority="high"
      decoding="async"
      data-nimg="fill"
      class="opacity-1 !transition relative size-full object-cover gradient-mask-b-0"
      style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
      sizes="100vw"
      src={cover}
    />
  );
}
