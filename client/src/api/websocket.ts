import type { Dimensions, RGBColor } from '../utils/drawing';
import type { Point } from '../utils/point';
import { normalizePoint, pointsToBytes } from '../utils/point';
import { API_WS_URL } from './config';

type WSMessage = 'DRAW_PATH';

export const WS_MESSAGE_TYPES: Record<WSMessage, number> = {
  DRAW_PATH: 1,
} as const;

export function createWebSocket() {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(API_WS_URL);
    ws.binaryType = 'arraybuffer';

    ws.addEventListener(
      'open',
      () => {
        resolve(ws);
      },
      { once: true }
    );
    ws.addEventListener(
      'error',
      () => {
        reject(new Error('Failed to connect to WebSocket'));
      },
      { once: true }
    );
  });
}

export const messageSerializer = {
  DRAW_PATH: (points: Point[], canvasDimensions: Dimensions, color: RGBColor) =>
    new Uint8Array([
      WS_MESSAGE_TYPES.DRAW_PATH,
      ...color,
      ...pointsToBytes(
        points.map((point) => normalizePoint(point, canvasDimensions))
      ),
    ]),
} as const;
