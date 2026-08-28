export const IFRAME_PLAYER_COMMAND_TYPE = 'iframe-player-command' as const;

const SIMPLE_COMMAND_ACTIONS = [
  'play',
  'pause',
  'mute',
  'unmute',
  'get-volume',
  'get-quality',
  'get-qualities',
  'get-subtitles',
  'get-buffered',
  'toggle-picture-in-picture',
] as const;

type SimpleCommandAction = (typeof SIMPLE_COMMAND_ACTIONS)[number];

type SimpleCommand = {
  [Action in SimpleCommandAction]: { action: Action };
}[SimpleCommandAction];

export type IFramePlayerCommandPayload =
  | SimpleCommand
  | { action: 'seek'; value: number }
  | { action: 'set-volume'; value: number }
  | { action: 'set-speed'; value: number; index: number }
  | { action: 'set-quality'; value: string; index: number }
  | { action: 'set-subtitle'; value: string; index: number };

export type IFramePlayerCommand = IFramePlayerCommandPayload & {
  type: typeof IFRAME_PLAYER_COMMAND_TYPE;
};

type IFramePlayerBridgeCommandPayload = Exclude<
  IFramePlayerCommandPayload,
  { action: 'toggle-picture-in-picture' }
>;

export type IFramePlayerBridgeCommand = IFramePlayerBridgeCommandPayload & {
  type: typeof IFRAME_PLAYER_COMMAND_TYPE;
};

export interface IFramePlayerEvent {
  event: string;
  data?: unknown;
  answer?: unknown;
}

export const sendIFramePlayerCommand = (command: IFramePlayerCommandPayload) =>
  browser.runtime.sendMessage({
    type: IFRAME_PLAYER_COMMAND_TYPE,
    ...command,
  } satisfies IFramePlayerCommand);

export const isIFramePlayerCommand = (
  message: unknown,
): message is IFramePlayerCommand => {
  if (!message || typeof message !== 'object') return false;

  const candidate = message as Record<string, unknown>;
  if (
    candidate.type !== IFRAME_PLAYER_COMMAND_TYPE ||
    typeof candidate.action !== 'string'
  ) {
    return false;
  }

  if (SIMPLE_COMMAND_ACTIONS.some((action) => action === candidate.action)) {
    return true;
  }

  switch (candidate.action) {
    case 'seek':
    case 'set-volume':
      return isFiniteNumber(candidate.value);
    case 'set-speed':
      return (
        isFiniteNumber(candidate.value) && Number.isInteger(candidate.index)
      );
    case 'set-quality':
    case 'set-subtitle':
      return (
        typeof candidate.value === 'string' && Number.isInteger(candidate.index)
      );
    default:
      return false;
  }
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isIFramePlayerEvent = (
  message: unknown,
): message is IFramePlayerEvent =>
  !!message &&
  typeof message === 'object' &&
  'event' in message &&
  typeof message.event === 'string';
