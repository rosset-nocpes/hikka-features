import type { IFramePlayerBridgeClass } from './bridge';

import { PlayerJsBridge } from './playerjs-bridge';
import { PlyrBridge } from './plyr-bridge';

const bridgeClasses = [
  PlyrBridge,
  PlayerJsBridge,
] satisfies IFramePlayerBridgeClass[];

export const IFRAME_PLAYER_MATCHES = [
  'https://ashdi.vip/vod/*',
  'https://moonanime.art/iframe/*',
  'https://tortuga.tw/vod/*',
];

export const findIFramePlayerBridge = (video: HTMLVideoElement) =>
  bridgeClasses.find((Bridge) => Bridge.detect(video));
