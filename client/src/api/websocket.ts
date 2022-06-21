import { API_WS_URL } from './config';

// eslint-disable-next-line import/prefer-default-export
export function createWebSocket() {
  console.log('will create promise');
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(API_WS_URL);
    ws.binaryType = 'arraybuffer';

    console.log('adding ws listeners');
    ws.addEventListener(
      'open',
      () => {
        console.log('resolving ws conn');

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
