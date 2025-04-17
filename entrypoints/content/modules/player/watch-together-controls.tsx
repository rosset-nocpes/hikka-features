import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Link, MessageCircle, UserPlus, Users, X } from 'lucide-react';
import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePlayerContext } from './context/player-context';

interface Props {
  container: HTMLElement;
  animeSlug: string;
}

const formSchema = z.object({
  roomId: z.string().min(7).max(7),
});

const WatchTogetherControls: FC<Props> = ({ container, animeSlug }) => {
  const playerContext = usePlayerContext();

  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [showChat, setShowChat] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: '',
    },
  });

  const path_params = new URLSearchParams(document.location.search);

  browser.runtime.onMessage.addListener(async (response: any) => {
    if (response.type === 'watch-together') {
      switch (response.action) {
        case 'created':
          setRoomId(response.roomId);
          setIsHost(true);
          break;

        case 'joined':
          setRoomId(response.roomId);

          const newEpisode = playerContext.state.episodeData.find(
            (episode: API.EpisodeData) =>
              episode.episode === response.episodeNumber,
          );
          if (!newEpisode) break;

          playerContext.setState((prev) => ({
            ...prev,
            provider: response.playerProvider,
            team: response.teamName,
            currentEpisode: newEpisode,
          }));

          setShowChat(false);
          break;

        case 'left':
          if (response.roomId === roomId) {
            setRoomId('');
            setIsHost(false);
            setShowChat(false);
          }
          break;

        default:
          break;
      }
    }
  });

  const handleCreateRoom = () => {
    browser.runtime.sendMessage(undefined, {
      type: 'watch-together',
      action: 'create',
      animeSlug,
      playerInfo: {
        playerProvider: playerContext.state.provider,
        teamName: playerContext.state.team,
        episodeNumber: playerContext.state.currentEpisode.episode,
      },
    });
  };

  const handleJoinRoom = (values: z.infer<typeof formSchema>) => {
    browser.runtime.sendMessage(undefined, {
      type: 'watch-together',
      action: 'join',
      roomId: values.roomId,
    });
  };

  const leaveRoom = () => {
    browser.runtime.sendMessage(undefined, {
      type: 'watch-together',
      action: 'leave',
    });
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  const handlePlaybackResume = () => {
    browser.runtime.sendMessage(undefined, {
      type: 'watch-together',
      action: 'resume-playback',
    });
  };

  const handlePlaybackPause = () => {
    browser.runtime.sendMessage(undefined, {
      type: 'watch-together',
      action: 'pause-playback',
    });
  };

  // useEffect(() => {
  //   const messageHandler = (event: MessageEvent) => {
  //     if (event.data.type !== 'watch-together') return;

  //     switch (event.data.event) {
  //       case 'resume-playback':
  //         handlePlaybackResume();
  //         break;

  //       case 'pause-playback':
  //         handlePlaybackPause();
  //         break;
  //     }
  //   };

  //   window.addEventListener('message', messageHandler);
  //   return () => window.removeEventListener('message', messageHandler);
  // }, []);

  browser.runtime.onMessage.addListener(async (response: any) => {
    if (response.type === 'watch-together') {
      switch (response.action) {
        case 'resume-playback':
          console.log('resume-playback');
          break;

        case 'pause-playback':
          console.log('pause-playback');
          break;
      }
    }
  });

  if (path_params.has('room')) {
    handleJoinRoom({ roomId: path_params.get('room')! });
  }

  return (
    <div className="flex flex-1 items-center gap-2">
      {!roomId ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleCreateRoom}>
            <Users className="mr-1.5 h-4 w-4" />
            Watch Together
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Join Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" container={container}>
              <DialogHeader>
                <DialogTitle>Join Watch Party</DialogTitle>
              </DialogHeader>
              {/* <div className="grid gap-4 py-4">
                <Input placeholder="Enter room ID" />
                <Button>Join</Button>
              </div> */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleJoinRoom)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room ID</FormLabel>
                        <FormControl>
                          <Input placeholder="room id" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter room ID to join the watch party
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
            <Link className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-xs">{roomId}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyRoomId}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8">
                <MessageCircle className="mr-1.5 h-4 w-4" />
                Chat
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0"
              align="start"
              container={container}
            >
              <div className="flex h-[300px] flex-col">
                <div className="flex items-center justify-between border-b p-2">
                  <span className="font-medium text-sm">Watch Party Chat</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="text-center text-muted-foreground text-xs">
                    Chat messages will appear here
                  </div>
                </div>
                <div className="border-t p-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      className="h-8 text-sm"
                    />
                    <Button size="sm" className="h-8">
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={handlePlaybackPause}
          >
            TestPause
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-8 text-destructive hover:text-destructive"
            onClick={leaveRoom}
          >
            Leave Room
          </Button>
        </div>
      )}
    </div>
  );
};

export default WatchTogetherControls;
