import { assign, createMachine } from 'xstate';

import type { APIResponse } from '../api/client';
import client from '../api/client';
import { createWebSocket } from '../api/websocket';
import type { Room } from './models';

export interface RoomMachineContext {
  roomId: string | null;
  error: string | null;
  ws: WebSocket | null;
}

export type RoomMachineEvent =
  | { type: 'INIT' }
  | { type: 'JOIN_ROOM'; roomId: string }
  | { type: 'CREATE_ROOM' };

export type RoomMachine = ReturnType<typeof createRoomMachine>;

const createRoomMachine = (roomId: string | null) =>
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
        },
      },
      id: 'room',
      initial: 'idle',
      context: { roomId, ws: null, error: null },
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
        joinedRoom: { entry: 'navigateToRoom' },
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
        connect: () => (console.log('connecting...'), createWebSocket()),
      },
      actions: {
        assignRoomId: assign((_context, event) => ({
          roomId: event.roomId,
        })),
        assignRoomIdFromResponse: assign((_context, event) => ({
          roomId: event.data.data.id,
        })),
        assignConnection: assign((_context, data) => ({ ws: data.data })),
        assignErrorFromResponse: assign((_context, event) => ({
          error: (event.data as Error).message,
        })),
      },
      guards: {
        alreadyJoined: (context) => context.roomId !== null,
      },
    }
  );

export default createRoomMachine;
