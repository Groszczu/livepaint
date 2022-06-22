import { assign, createMachine } from 'xstate';

import type { APIResponse } from '../api/client';
import client from '../api/client';
import { createWebSocket, messageSerializer } from '../api/websocket';
import type { Dimensions, RGBColor } from '../utils/drawing';
import { rgbToCSSString, pointsToSvgPath } from '../utils/drawing';
import type { Point } from '../utils/point';
import { bytesToPoints } from '../utils/point';
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
  | { type: 'DRAW_PATH_MESSAGE'; bytes: number[] };

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
            DRAW_PATH_MESSAGE: { actions: 'drawPath' },
          },

          states: {
            waitingForContext: {
              on: {
                CREATE_CONTEXT: {
                  target: 'idle',
                  actions: ['assignCanvasContext', 'setupCanvasContext'],
                },
              },
            },
            idle: {
              on: {
                START_DRAWING: {
                  target: 'drawing',
                  actions: ['startDrawing', 'assignPointToCurrentPath'],
                },
              },
            },
            drawing: {
              on: {
                DRAW_POINT: {
                  target: 'drawing',
                  actions: ['drawPoint', 'assignPointToCurrentPath'],
                },
                STOP_DRAWING: {
                  target: 'sendingUpdate',
                },
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
        connect: () => createWebSocket(),
        sendUpdate: (context) =>
          new Promise((resolve) => {
            if (context.ws && context.currentPath.length !== 0) {
              context.ws?.send(
                messageSerializer.DRAW_PATH(
                  context.currentPath,
                  context.fillColor
                )
              );
            }
            resolve(null);
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
            pointsToSvgPath(bytesToPoints(pathBytes))
          );

          ctx.strokeStyle = rgbToCSSString([r, g, b]);
          ctx.stroke(pathToDraw);
        },
        emptyCurrentPath: assign(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (_) => ({ currentPath: [] })
        ),
      },
      guards: {
        alreadyJoined: (context) => context.roomId !== null,
      },
    }
  );

export default createRoomMachine;
