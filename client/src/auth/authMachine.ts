import type { NavigateFunction } from 'react-router-dom';
import type { ActorRefFrom } from 'xstate';
import { send, assign, createMachine, spawn } from 'xstate';

import type { APIResponse } from '../api/client';
import client from '../api/client';
import type { RoomMachine, RoomMachineContext } from '../rooms/roomMachine';
import createRoomMachine from '../rooms/roomMachine';
import type { Client } from './models';

export interface AuthMachineContext {
  client: Client | null;
  roomRef: ActorRefFrom<RoomMachine> | null;
  error: string | null;
}

export type AuthMachineEvent =
  | { type: 'GET_CLIENT' }
  | { type: 'REGISTER'; username: string };

export type AuthMachine = ReturnType<typeof createAuthMachine>;

const createAuthMachine = (navigate: NavigateFunction) => {
  const navigateActions = {
    navigateToHome: () => navigate('/', { replace: true }),
    navigateToRoom: (context: RoomMachineContext) =>
      navigate(`/room/${context.roomId}`),
  };
  return createMachine(
    {
      tsTypes: {} as import('./authMachine.typegen').Typegen0,
      schema: {
        context: {} as AuthMachineContext,
        events: {} as AuthMachineEvent,
        services: {} as {
          getClient: {
            data: APIResponse<Client>;
          };
          register: {
            data: APIResponse<Client>;
          };
        },
      },
      id: 'auth',
      initial: 'gettingClient',
      context: { client: null, roomRef: null, error: null },
      states: {
        gettingClient: {
          invoke: {
            id: 'getClient',
            src: 'getClient',
            onDone: {
              target: 'loggedIn',
              actions: 'assignClientFromResponse',
            },
            onError: {
              target: 'loggedOut',
            },
          },
        },

        loggedOut: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                REGISTER: { target: 'registering' },
              },
            },
            registering: {
              invoke: {
                id: 'register',
                src: 'register',
                onDone: {
                  target: '#auth.loggedIn',
                  actions: 'assignClientFromResponse',
                },
                onError: {
                  target: 'failure',
                  actions: 'assignErrorFromResponse',
                },
              },
            },
            success: {
              always: '#auth.loggedIn',
            },
            failure: {
              always: 'idle',
            },
          },
        },

        loggedIn: {
          entry: ['spawnRoomActor', 'sendInitRoomEvent'],
        },
      },
    },
    {
      services: {
        getClient: () => client<Client>('auth/me/'),
        register: (_context, event) =>
          client<Client>('auth/session/', {
            data: { username: event.username },
          }),
      },
      actions: {
        assignClientFromResponse: assign((_context, event) => ({
          error: null,
          client: event.data.data,
        })),
        assignErrorFromResponse: assign((_context, event) => ({
          error: (event.data as Error).message,
        })),
        spawnRoomActor: assign((context) => ({
          roomRef: spawn(
            createRoomMachine(context.client?.room?.id ?? null).withConfig({
              actions: navigateActions,
            }),
            'room'
          ),
        })),
        sendInitRoomEvent: send(
          {
            type: 'INIT',
          },
          { to: 'room' }
        ),
      },
    }
  );
};

export default createAuthMachine;
