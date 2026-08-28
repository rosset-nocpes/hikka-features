import type { IFramePlayerBridgeClass } from './bridge';

import { PlayerJsBridge } from './playerjs-bridge';
import { PlyrBridge } from './plyr-bridge';

const bridgeClasses = [
  PlyrBridge,
  PlayerJsBridge,
] satisfies IFramePlayerBridgeClass[];

export const IFRAME_PLAYER_MATCHES = bridgeClasses.flatMap((Bridge) => [
  ...Bridge.matches,
]);

export const findIFramePlayerBridge = (url: URL) =>
  bridgeClasses.find((Bridge) => Bridge.supports(url));
