interface LoginRequest {
  type: 'login';
}

interface RichPresenceCheckRequest {
  type: 'rich-presence-check';
  action: string;
}

interface WatchTogetherRequest {
  type: 'watch-together';
  action: 'create' | 'join' | 'leave';
  roomId?: string;
}

interface PlayerInfo {
  playerProvider: PlayerSource;
  teamName: string;
  episodeNumber: number;
}

interface WatchTogetherRequestHost extends WatchTogetherRequest {
  animeSlug: string;
  playerInfo: PlayerInfo;
}

type MessageRequest =
  | LoginRequest
  | RichPresenceCheckRequest
  | WatchTogetherRequest;

export default defineBackground(() => {
  browser.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (!details.transitionQualifiers.includes('forward_back')) {
      browser.tabs.sendMessage(details.tabId, { type: 'page-rendered' });
    }
  });

  browser.runtime.onMessage.addListener(
    async (request: unknown, sender): Promise<true | undefined> => {
      // Type guard for MessageRequest
      if (!request || typeof request !== 'object' || !('type' in request)) {
        return undefined;
      }

      const typedRequest = request as MessageRequest;
      switch (typedRequest.type) {
        case 'login':
          const auth_url = `https://hikka.io/oauth/?reference=${CLIENT_REFERENCE}&scope=${encodeURIComponent(
            NEEDED_SCOPES.join(','),
          )}`;

          browser.identity
            .launchWebAuthFlow({
              interactive: true,
              url: auth_url,
            })
            .then((response_url) => {
              console.log(response_url);
              const params = new URLSearchParams(response_url.split('?')[1]);

              hikkaSecret.setValue(params.get('secret')!);
              hikkaSecret.setMeta({
                expiration: Number(params.get('expiration')),
              });

              getUserData().then((r) => {
                userData.setValue({
                  hikkaId: r['reference'],
                  username: r['username'],
                  avatar: r['avatar'],
                });
              });
            });

          return true;

        case 'rich-presence-check':
          browser.tabs
            .query({ url: 'https://hikka.io/anime/*-*' })
            .then((tabs) => {
              browser.tabs.sendMessage(sender.tab!.id!, {
                type: 'rich-presence-reply',
                action: typedRequest.action,
                tabs_count: tabs.length,
              });
            });

          return true;

        case 'watch-together':
          const userDataValue = await userData.getValue();

          switch (typedRequest.action) {
            case 'create':
              const { animeSlug, playerInfo } =
                typedRequest as WatchTogetherRequestHost;

              ws.send(
                JSON.stringify({
                  type: 'create',
                  userData: userDataValue,
                  animeSlug,
                  playerInfo,
                }),
              );

              ws.addEventListener('message', (event) => {
                const r = JSON.parse(event.data);
                if (r.type === 'system' && r.action === 'created') {
                  browser.tabs.sendMessage(sender.tab!.id!, {
                    type: 'watch-together',
                    action: 'created',
                    roomId: r.roomId,
                  });
                }
              });

              return true;

            case 'join':
              ws.send(
                JSON.stringify({
                  type: 'join',
                  userData: userDataValue,
                  room: typedRequest.roomId!,
                }),
              );

              ws.addEventListener('message', (event) => {
                const r = JSON.parse(event.data);
                if (r.type === 'system' && r.action === 'joined') {
                  browser.tabs.sendMessage(sender.tab!.id!, {
                    type: 'watch-together',
                    action: 'joined',
                    roomId: r.roomId,
                  });
                }
              });

              return true;

            case 'leave':
              ws.send(
                JSON.stringify({
                  type: 'leave',
                  userData: userDataValue,
                }),
              );

              ws.addEventListener('message', (event) => {
                const r = JSON.parse(event.data);
                if (r.type === 'system' && r.action === 'left') {
                  browser.tabs.sendMessage(sender.tab!.id!, {
                    type: 'watch-together',
                    action: 'left',
                    roomId: r.roomId,
                  });
                }
              });

              return true;

            default:
              return undefined;
          }
        default:
          return undefined;
      }
    },
  );

  // Initialize WebSocket connection
  let ws: WebSocket;
  connectWebSocket();

  // ws!.send(
  //   JSON.stringify({
  //     type: "join",
  //     room: "123",
  //     message: "Hello from the background script!",
  //   })
  // );

  function connectWebSocket() {
    // Replace with your WebSocket server URL
    ws = new WebSocket(import.meta.env.WXT_BACKEND_WS_ENDPOINT);

    // Event: Connection opened
    ws.onopen = () => {
      console.log('WebSocket connection opened.');
      // ws.send(JSON.stringify({ message: "Hello from the browser extension!" }));
      // ws.send(
      //   JSON.stringify({
      //     type: "join",
      //     room: "123",
      //     // content: "Hello from the background script!",
      //   })
      // );
    };

    // Event: Message received
    ws.onmessage = (event) => {
      console.log('Message received from server:', event.data);
      // Process the message or forward it to a content script if needed
    };

    // Event: Connection closed
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.reason);
      // Optionally, attempt to reconnect
      setTimeout(connectWebSocket, 5000); // Retry connection after 5 seconds
    };

    // Event: Error occurred
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
});
