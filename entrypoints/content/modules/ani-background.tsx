import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';

const aniBackground = async (
  ctx: ContentScriptContext,
  mal_id: number,
  type: MediaType,
) => {
  if (document.body.querySelectorAll('ani-background').length !== 0) {
    return;
  }

  if (type === 'novel') {
    type = 'manga';
  }

  const anilist_url = 'https://graphql.anilist.co';
  const banner_query = `
    query media($mal_id: Int, $type: MediaType) {
        Media(idMal: $mal_id, type: $type) {
          bannerImage
        }
    }
    `;

  const background_data = await (
    await fetch(anilist_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: banner_query,
        variables: {
          mal_id: mal_id,
          type: type.toUpperCase(),
        },
      }),
    })
  ).json();

  const banner = background_data.data.Media?.bannerImage;

  if (banner === undefined) {
    return null;
  }

  return createShadowRootUi(ctx, {
    name: 'ani-background',
    position: 'inline',
    append: 'last',
    anchor: document.querySelector('body main > .grid')!,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(<AniBackground banner_url={banner} />);

      return { root, wrapper };
    },
  });
};

interface Props {
  banner_url: string;
}

const AniBackground: FC<Props> = ({ banner_url }) => {
  const [stateBack, setAniBack] = useState<boolean>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeAsync = async () => {
      setAniBack(await aniBackState.getValue());
    };
    initializeAsync();

    const img = new Image();
    img.src = banner_url;

    img.onload = () => setIsLoaded(true);
  }, []);

  aniBackState.watch((state) => setAniBack(state));

  return (
    <AnimatePresence>
      {stateBack && isLoaded && (
        <motion.div
          className="-z-20 absolute top-0 left-0 h-80 w-full overflow-hidden opacity-40"
          initial={{ height: 0 }}
          animate={{ height: '20rem' }}
          exit={{ height: 0 }}
        >
          <img
            id="cover"
            alt="cover"
            fetchPriority="high"
            decoding="async"
            data-nimg="fill"
            className="!transition gradient-mask-b-0 relative size-full object-cover opacity-1"
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              left: '0',
              top: '0',
              right: '0',
              bottom: '0',
              color: 'transparent',
            }}
            sizes="100vw"
            src={banner_url}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default aniBackground;
