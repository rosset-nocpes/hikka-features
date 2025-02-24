import { Button } from '@/components/ui/button';
import { FC } from 'react';

interface Props {
  container: HTMLElement;
  playerState: PlayerState;
  data: API.WatchData;
  getWatchedState: boolean;
  getNextEpState: boolean;
  setNextEpState: any;
  toggleWatchedState: any;
  handleSelectEpisode: any;
}

const AshdiPlayer: FC<Props> = ({
  container,
  playerState,
  data,
  getWatchedState,
  getNextEpState,
  setNextEpState,
  toggleWatchedState,
  handleSelectEpisode,
}) => {
  const getWatched = () =>
    parseInt(
      document.body.querySelector('div.rounded-lg.border:nth-child(2) h3')
        ?.firstChild?.nodeValue!,
    );

  let duration = 0;
  let time = 0;
  //   todo implement

  //   useEffect(() => {

  //     const img = new Video();
  //     img.src = banner_url;

  //     img.onload = () => setIsLoaded(true);
  //   }, []);

  window.addEventListener('message', function (event) {
    console.log(event);
    if (event.data.event === 'time') {
      let message = event.data;
      duration = message.duration;
      time = message.time;

      if (time / duration > 0.88 && !getWatchedState) {
        if (getWatched() + 1 === playerState.episode.episode) {
          (
            document.body.querySelector(
              'div.inline-flex:nth-child(2) button:nth-child(2)',
            ) as HTMLButtonElement
          )?.click();
          toggleWatchedState(true);
        }
      }
    } else if (
      event.data.event === 'pause' &&
      time / duration > 0.8 &&
      getNextEpState === false &&
      data[playerState.provider][playerState.team].find(
        (obj: any) => obj.episode == playerState.episode.episode + 1,
      )
    ) {
      setNextEpState(true);
    } else if (event.data.event === 'play') {
      setNextEpState(false);
    }
  });

  return (
    <>
      {getNextEpState && (
        <Button
          className="absolute top-4"
          onClick={() => {
            handleSelectEpisode(
              data[playerState.provider][playerState.team].find(
                (obj: any) => obj.episode == playerState.episode.episode + 1,
              ),
            );
            setNextEpState(false);
          }}
        >
          Настпуний епізод
        </Button>
      )}
      <iframe
        id="player-ashdi-iframe"
        src={`${playerState.episode.video_url}?site=hikka.io`}
        loading="lazy"
        style={{
          borderRadius: '10px',
          height: '100%',
          width: '100%',
          zIndex: 2,
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      ></iframe>
    </>
  );
};

export default AshdiPlayer;
