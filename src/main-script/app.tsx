import { onNavigate } from '@violentmonkey/url';
import * as scripts from './scripts/index.js';

onNavigate(async () => {
  const split_path = document.location.pathname.split('/');

  const path = split_path[1];

  // for anime page scripts
  if (split_path.length == 3 && path == 'anime') {
    const anime_slug = split_path[2];

    const anime_data = await (
      await fetch(`https://api.hikka.io/anime/${anime_slug}`)
    ).json();

    // call functions under this comment
    scripts.aniBackground(anime_data);
    scripts.aniButtons(anime_data);
    scripts.hikkaWatari(anime_data);
    scripts.amanogawaButton(anime_data);
  }
});
