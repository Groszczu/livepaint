import { assign, createMachine } from 'xstate';
import { send } from 'xstate/lib/actions';

import type { APIResponse } from '../api/client';
import client from '../api/client';
import { createWebSocket, messageSerializer } from '../api/websocket';
import type { Dimensions, RGBColor } from '../utils/drawing';
import { rgbToCSSString, pointsToSvgPath } from '../utils/drawing';
import type { Point } from '../utils/point';
import { denormalizePoint, bytesToPoints } from '../utils/point';
import type { Room } from './models';

export interface RoomMachineContext {
  roomId: string | null;
  error: string | null;
  ws: WebSocket | null;
  fillColor: RGBColor;
  canvasContext: CanvasRenderingContext2D | null;
  currentPath: Point[];
}

export type RoomMachineEvent =
  | { type: 'INIT' }
  | { type: 'JOIN_ROOM'; roomId: string }
  | { type: 'CREATE_ROOM' }
  | {
      type: 'CREATE_CONTEXT';
      canvasContext: CanvasRenderingContext2D;
      canvasDimensions: Dimensions;
    }
  | { type: 'START_DRAWING'; pointerPosition: Point }
  | { type: 'DRAW_POINT'; pointerPosition: Point }
  | { type: 'STOP_DRAWING' }
  | { type: 'DRAW_PATH_MESSAGE'; bytes: number[] }
  | { type: 'SEND_UPDATE' }
  | { type: 'LEAVE_ROOM' };

export type RoomMachine = ReturnType<typeof createRoomMachine>;

const createRoomMachine = (roomId: string | null, fillColor: RGBColor) =>
  createMachine(
    {
      tsTypes: {} as import('./roomMachine.typegen').Typegen0,
      schema: {
        context: {} as RoomMachineContext,
        events: {} as RoomMachineEvent,
        services: {} as {
          joinRoom: {
            data: APIResponse<Room>;
          };
          createRoom: {
            data: APIResponse<Room>;
          };
          connect: {
            data: WebSocket;
          };
          sendUpdate: { data: null };
          loadPersistedCanvas: { data: null };
        },
      },
      id: 'room',
      initial: 'idle',
      context: {
        roomId,
        fillColor,
        ws: null,
        canvasContext: null,
        error: null,
        currentPath: [],
      },
      states: {
        idle: {
          on: {
            INIT: [
              {
                cond: 'alreadyJoined',
                target: 'connecting',
              },
              {
                target: 'idle',
                actions: 'navigateToHome',
              },
            ],
            JOIN_ROOM: {
              target: 'joiningRoom',
              actions: 'assignRoomId',
            },
            CREATE_ROOM: {
              target: 'creatingRoom',
            },
          },
        },
        joiningRoom: {
          invoke: {
            id: 'joinRoom',
            src: 'joinRoom',
            onDone: {
              target: 'connecting',
              actions: 'assignRoomIdFromResponse',
            },
            onError: {
              target: 'failedToJoinRoom',
              actions: 'assignErrorFromResponse',
            },
          },
        },
        leavingRoom: {
          invoke: {
            id: 'leaveRoom',
            src: 'leaveRoom',
            onDone: {
              target: 'idle',
              actions: 'navigateToHome',
            },
            onError: {
              target: 'joinedRoom',
              actions: 'assignErrorFromResponse',
            },
          },
        },
        creatingRoom: {
          invoke: {
            id: 'createRoom',
            src: 'createRoom',
            onDone: {
              target: 'connecting',
              actions: 'assignRoomIdFromResponse',
            },
            onError: {
              target: 'failedToJoinRoom',
              actions: 'assignErrorFromResponse',
            },
          },
        },
        connecting: {
          invoke: {
            id: 'connect',
            src: 'connect',
            onDone: {
              target: 'joinedRoom',
              actions: 'assignConnection',
            },
            onError: {
              target: 'failedToJoinRoom',
              actions: 'assignErrorFromResponse',
            },
          },
        },
        joinedRoom: {
          entry: 'navigateToRoom',
          initial: 'waitingForContext',

          on: {
            DRAW_PATH_MESSAGE: { actions: ['drawPath', 'persistCanvas'] },
            LEAVE_ROOM: { target: 'leavingRoom', actions: 'navigateToHome' },
          },

          states: {
            waitingForContext: {
              on: {
                CREATE_CONTEXT: {
                  target: 'loadingPersistedCanvas',
                  actions: ['assignCanvasContext', 'setupCanvasContext'],
                },
              },
            },
            loadingPersistedCanvas: {
              invoke: {
                id: 'loadPersistedCanvas',
                src: 'loadPersistedCanvas',
                onDone: {
                  target: 'readyToDraw',
                },
              },
            },
            readyToDraw: {
              type: 'parallel',
              states: {
                draw: {
                  initial: 'idle',

                  states: {
                    idle: {
                      on: {
                        START_DRAWING: {
                          target: 'drawing',
                          actions: ['startDrawing', 'assignPointToCurrentPath'],
                        },
                      },
                    },
                    drawing: {
                      after: {
                        200: { actions: 'sendUpdate' },
                      },
                      on: {
                        DRAW_POINT: {
                          target: 'drawing',
                          actions: ['drawPoint', 'assignPointToCurrentPath'],
                        },
                        STOP_DRAWING: {
                          target: 'idle',
                          actions: 'sendUpdate',
                        },
                      },
                    },
                  },
                },
                update: {
                  initial: 'idle',
                  states: {
                    idle: {
                      on: {
                        SEND_UPDATE: { target: 'sendingUpdate' },
                      },
                    },
                    sendingUpdate: {
                      invoke: {
                        id: 'sendUpdate',
                        src: 'sendUpdate',
                        onDone: { target: 'idle', actions: 'emptyCurrentPath' },
                        onError: { target: 'idle' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        failedToJoinRoom: {
          entry: 'navigateToHome',
          on: {
            JOIN_ROOM: {
              target: 'joiningRoom',
              actions: 'assignRoomId',
            },
            CREATE_ROOM: {
              target: 'creatingRoom',
            },
          },
        },
      },
    },
    {
      services: {
        joinRoom: (context) =>
          client<Room>(`rooms/${context.roomId}/join/`, { method: 'POST' }),
        createRoom: () => client<Room>(`rooms/`, { method: 'POST' }),
        leaveRoom: (context) =>
          client(`rooms/${context.roomId}/leave/`, { method: 'DELETE' }),
        connect: () => createWebSocket(),
        sendUpdate: (context) =>
          new Promise((resolve) => {
            const ctx = context.canvasContext;
            if (context.ws && ctx && context.currentPath.length !== 0) {
              context.ws.send(
                messageSerializer.DRAW_PATH(
                  context.currentPath,
                  { width: ctx.canvas.width, height: ctx.canvas.height },
                  context.fillColor
                )
              );
            }
            resolve(null);
          }),
        loadPersistedCanvas: (context) =>
          new Promise((resolve) => {
            const ctx = context.canvasContext;
            if (!context.roomId || !ctx) {
              resolve(null);
              return;
            }
            const persistedImageURL = localStorage.getItem(context.roomId);
            if (!persistedImageURL) {
              resolve(null);
              return;
            }
            const img = new Image();
            img.onload = () => {
              ctx.canvas.width = img.width;
              ctx.canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              resolve(null);
            };

            img.src = persistedImageURL;
          }),
      },
      actions: {
        assignRoomId: assign((_context, event) => ({
          roomId: event.roomId,
        })),
        assignRoomIdFromResponse: assign((_context, event) => ({
          roomId: event.data.data.id,
        })),
        assignConnection: assign((_context, event) => ({
          ws: event.data,
        })),
        assignErrorFromResponse: assign((_context, event) => ({
          error: (event.data as Error).message,
        })),
        assignPointToCurrentPath: assign((context, event) => ({
          currentPath: [...context.currentPath, event.pointerPosition],
        })),
        assignCanvasContext: assign((_context, event) => ({
          canvasContext: event.canvasContext,
        })),
        setupCanvasContext: (context, event) => {
          const ctx = context.canvasContext;
          if (!ctx) {
            return;
          }
          ctx.fillStyle = '#FFF';
          ctx.fillRect(
            0,
            0,
            event.canvasDimensions.width,
            event.canvasDimensions.height
          );
        },
        startDrawing: (context) => {
          const ctx = context.canvasContext;
          if (!ctx) {
            return;
          }
          ctx.strokeStyle = rgbToCSSString(context.fillColor);
          ctx.beginPath();
        },
        drawPoint: (context, event) => {
          const ctx = context.canvasContext;
          if (!ctx) {
            return;
          }

          ctx.lineTo(event.pointerPosition.x, event.pointerPosition.y);
          ctx.stroke();
        },
        drawPath: (context, event) => {
          const ctx = context.canvasContext;
          if (!ctx) {
            return;
          }

          const [r, g, b, ...pathBytes] = event.bytes;
          const pathToDraw = new Path2D(
            pointsToSvgPath(
              bytesToPoints(pathBytes).map((point) =>
                denormalizePoint(point, {
                  width: ctx.canvas.width,
                  height: ctx.canvas.height,
                })
              )
            )
          );

          ctx.strokeStyle = rgbToCSSString([r, g, b]);
          ctx.stroke(pathToDraw);
        },
        sendUpdate: send('SEND_UPDATE'),
        emptyCurrentPath: assign(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (_) => ({ currentPath: [] })
        ),
        persistCanvas: (context) => {
          const ctx = context.canvasContext;
          if (!context.roomId || !ctx) {
            return;
          }
          const canvasImageURL = ctx.canvas.toDataURL();
          localStorage.setItem(context.roomId, canvasImageURL);
        },
      },
      guards: {
        alreadyJoined: (context) => context.roomId !== null,
      },
    }
  );

export default createRoomMachine;
