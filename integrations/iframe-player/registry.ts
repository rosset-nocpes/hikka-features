import type { IFramePlayerBridgeClass } from './bridge';

import { PlayerJsBridge } from './playerjs-bridge';
import { PlyrBridge } from './plyr-bridge';

const bridgeClasses = [
  PlyrBridge,
  PlayerJsBridge,
] satisfies IFramePlayerBridgeClass[];

export const IFRAME_PLAYER_MATCHES = ['https://*/*'];

export const findIFramePlayerBridge = (video: HTMLVideoElement) =>
  bridgeClasses.find((Bridge) => Bridge.detect(video));
