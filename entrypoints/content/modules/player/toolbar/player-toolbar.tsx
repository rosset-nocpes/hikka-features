import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import MaterialSymbolsFullscreen from '~icons/material-symbols/fullscreen';
import MaterialSymbolsWidthFullOutlineSharp from '~icons/material-symbols/width-full-outline-sharp';
import { usePlayerContext } from '../context/player-context';
import WatchTogetherControls from '../watch-together-controls';
import ShareLinkButton from './share-link-button';

interface Props {
  container: HTMLElement;
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
  time,
  isTimecodeLink,
  timecodeLink,
  setTimecodeLink,
  toggleTimestampLink,
  handleEnterFullscreen,
  toggleTheatreState,
  getTheatreState,
}) => {
  const playerContext = usePlayerContext();
  const { open } = useSidebar();

  const [getUserData, setUserData] = useState<UserDataV2 | null>();

  useEffect(() => {
    const initializeAsync = async () => {
      const userDataValue = await userData.getValue();

      setUserData(userDataValue);
    };

    initializeAsync();
  }, []);

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-2 opacity-100 duration-300',
        !open && '-mt-8 opacity-0',
      )}
    >
      {getUserData && (
        <WatchTogetherControls
          container={container}
          animeSlug={playerContext.state.animeData.slug}
        />
      )}
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="sm" onClick={handleEnterFullscreen}>
              <MaterialSymbolsFullscreen className="flex-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fullscreen (custom)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toggleTheatreState(!getTheatreState);
              }}
            >
              <MaterialSymbolsWidthFullOutlineSharp className="flex-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Theater Mode</TooltipContent>
        </Tooltip>
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
