import { version } from '@/package.json';

import { useEffect, useState } from 'react';
import MdiGithub from '~icons/mdi/github';
import MdiTelegram from '~icons/mdi/telegram';
import '../app.css';
import AniBackgroundSettings from './options/anibackground-settings';
import AniButtonsSettings from './options/anibuttons-settings';
import ExperimentalSettings from './options/experimental-settings';
import FandubSettings from './options/fandub-settings';
import LocalizedPosterSettings from './options/localized-poster-settings';
import PlayerSettings from './options/player-settings';
import ReaderSettings from './options/reader-settings';
import RecommendationBlockSettings from './options/recommendation-block-settings';
import UserOptions from './options/user-options';

function App() {
  const [showDevOptions, toggleDevOptions] = useState<boolean | null>(null);

  const [getBurunyaaMode, toggleBurunyaaMode] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([devOptionsState.getValue(), burunyaaMode.getValue()]).then(
      ([devOptions, burunyaaMode]) => {
        toggleDevOptions(devOptions);
        toggleBurunyaaMode(burunyaaMode);
      },
    );
  }, []);

  let devClicked = 0;

  return (
    <div data-vaul-drawer-wrapper>
      <style>
        {`:root { background-color: black; } 
        .slide-fade-enter-active {
          transition: all 0.3s ease;
        }
        .slide-fade-exit-active {
          transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
        }
        .slide-fade-enter,
        .slide-fade-exit-to {
          transform: translateX(10px);
          opacity: 0;
        }`}
      </style>
      <div
        className={cn(
          'flex w-[400px] flex-col gap-7 rounded-none p-[30px] font-inter font-semibold',
          getBurunyaaMode
            ? 'bg-[url(https://media1.tenor.com/m/PDzKPqFw6f8AAAAC/neco-neco-arc.gif)]'
            : 'bg-black',
        )}
      >
        <h3 className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-lg tracking-normal">
            Налаштування
            <ExperimentalSettings
              showDevOptions={showDevOptions!}
              getBurunyaaMode={getBurunyaaMode}
              toggleBurunyaaMode={toggleBurunyaaMode}
            />
          </span>
          <UserOptions />
        </h3>
        <div className="flex flex-col gap-5">
          <PlayerSettings />
          <ReaderSettings />
          <AniButtonsSettings />
          <FandubSettings />
          <RecommendationBlockSettings />
          <AniBackgroundSettings />
          <LocalizedPosterSettings />
        </div>
        <div className="flex items-center justify-between gap-1 text-[#5C5C5C] text-xs">
          <a
            href="https://github.com/rosset-nocpes/hikka-features"
            className="flex items-center gap-1 font-bold"
          >
            <MdiGithub />
            GitHub
          </a>
          <a className="cursor-default">/</a>
          <button
            onClick={() => {
              devClicked++;
              if (devClicked === 5) {
                devOptionsState.setValue(!showDevOptions);
                toggleDevOptions(!showDevOptions);
                devClicked = 0;
              }
            }}
          >
            v{version}
          </button>
          <a className="cursor-default">/</a>
          <a
            href="https://t.me/hikka_features"
            className="flex items-center gap-1 font-bold"
          >
            <MdiTelegram />
            TG канал
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
