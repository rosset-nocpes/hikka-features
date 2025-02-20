import { Button } from '@/components/ui/button';
import { FC } from 'react';
import MaterialSymbolsFullscreen from '~icons/material-symbols/fullscreen';
import MaterialSymbolsWidthFullOutlineSharp from '~icons/material-symbols/width-full-outline-sharp';
import WatchTogetherControls from '../watch-together-controls';
import ShareLinkButton from './share-link-button';

interface Props {
  container: HTMLElement;
  animeSlug: string;
  time: number;
  isTimecodeLink: boolean;
  timecodeLink: number;
  setTimecodeLink: (value: number) => void;
  toggleTimestampLink: (value: boolean) => void;
  toggleTheatreState: (value: boolean) => void;
  getTheatreState: boolean;
  handleEnterFullscreen: () => void;
}

const PlayerToolbar: FC<Props> = ({
  container,
  animeSlug,
  time,
  isTimecodeLink,
  timecodeLink,
  setTimecodeLink,
  toggleTimestampLink,
  handleEnterFullscreen,
  toggleTheatreState,
  getTheatreState,
}) => {
  const [getUserData, setUserData] = useState<UserDataV2 | null>();

  useEffect(() => {
    const initializeAsync = async () => {
      const userDataValue = await userData.getValue();

      setUserData(userDataValue);
    };

    initializeAsync();
  }, []);

  return (
    <div className="flex items-center justify-end gap-2">
      {getUserData && (
        <WatchTogetherControls container={container} animeSlug={animeSlug} />
      )}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={handleEnterFullscreen}>
          <MaterialSymbolsFullscreen className="flex-1" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            toggleTheatreState(!getTheatreState);
          }}
        >
          <MaterialSymbolsWidthFullOutlineSharp className="flex-1" />
        </Button>
        <ShareLinkButton
          container={container}
          time={time}
          isTimecodeLink={isTimecodeLink}
          timecodeLink={timecodeLink}
          setTimecodeLink={setTimecodeLink}
          toggleTimestampLink={toggleTimestampLink}
        />
      </div>
    </div>
  );
};

export default PlayerToolbar;
