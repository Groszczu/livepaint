import { assign, createMachine } from 'xstate';

import client from '../api/client';
import type { Room } from './models';

export interface RoomMachineContext {
  roomId: string | null;
  error: string | null;
}

export type RoomMachineEvent =
  | { type: 'JOIN_ROOM'; roomId: string | null }
  | { type: 'CREATE_ROOM' };

export type RoomMachineTypestate =
  | {
      value: 'idle';
      context: RoomMachineContext & { room: null; error: null };
    }
  | {
      value: 'creatingRoom';
      context: RoomMachineContext & { room: null; error: null };
    }
  | {
      value: 'joiningRoom';
      context: RoomMachineContext & { room: null; error: null };
    }
  | {
      value: 'joinedRoom';
      context: RoomMachineContext & { room: Room; error: null };
    }
  | {
      value: 'failedToJoinRoom';
      context: RoomMachineContext & { room: null; error: string };
    };

const createRoomMachine = (roomId: string | null) =>
  createMachine<RoomMachineContext, RoomMachineEvent, RoomMachineTypestate>(
    {
      id: 'room',
      initial: 'idle',
      context: { roomId, error: null },
      states: {
        idle: {
          on: {
            JOIN_ROOM: [
              {
                cond: (context) => context.roomId !== null, // already joined
                target: 'joinedRoom',
              },
              {
                cond: (_context, event) => event.roomId !== null, // will join
                target: 'joiningRoom',
                actions: assign({ roomId: (_context, event) => event.roomId }),
              },
              {
                target: 'idle',
                actions: 'navigateToHome',
              },
            ],
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
              target: 'joinedRoom',
              actions: assign({
                roomId: (_context, event) => event.data.data.id,
              }),
            },
            onError: {
              target: 'failedToJoinRoom',
              actions: assign({
                error: (_context, event) => event.data.message,
              }),
            },
          },
        },
        creatingRoom: {
          invoke: {
            id: 'createRoom',
            src: 'createRoom',
            onDone: {
              target: 'joinedRoom',
              actions: assign({
                roomId: (_context, event) => event.data.data.id,
              }),
            },
            onError: {
              target: 'failedToJoinRoom',
              actions: assign({
                error: (_context, event) => event.data.message,
              }),
            },
          },
        },
        joinedRoom: { entry: 'navigateToRoom' },
        failedToJoinRoom: {
          entry: 'navigateToHome',
          on: {
            JOIN_ROOM: {
              target: 'joiningRoom',
              actions: assign({ roomId: (_context, event) => event.roomId }),
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
      },
    }
  );

export default createRoomMachine;
