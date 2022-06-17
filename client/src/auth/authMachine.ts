import type { NavigateFunction } from 'react-router-dom';
import type { ActorRefFrom } from 'xstate';
import { send, assign, createMachine, spawn } from 'xstate';

import client from '../api/client';
import type { Room } from '../rooms/models';
import type { RoomMachineContext } from '../rooms/roomMachine';
import createRoomMachine from '../rooms/roomMachine';
import type { Client } from './models';

type PartialNullable<T> = { [key in keyof T]: T[key] | null };
interface ClientWithRefs extends Omit<Client, 'room'> {
  room: {
    ref: ActorRefFrom<ReturnType<typeof createRoomMachine>>;
  } & PartialNullable<Room>;
}

export interface AuthMachineContext {
  client: ClientWithRefs | null;
  error: string | null;
}

export type AuthMachineEvent =
  | { type: 'GET_CLIENT' }
  | { type: 'REGISTER'; username: string };

export type AuthMachineTypestate =
  | {
      value: 'idle' | 'gettingClient' | 'loggedOut.registering';
      context: AuthMachineContext & { user: null; error: null };
    }
  | {
      value: 'loggedOut.idle';
      context: AuthMachineContext & { user: null; error: null | string };
    }
  | {
      value: 'loggedIn';
      context: AuthMachineContext & { user: Client; error: null };
    };

const createAuthMachine = (navigate: NavigateFunction) => {
  const navigateActions = {
    navigateToHome: () => navigate('/', { replace: true }),
    navigateToRoom: (context: RoomMachineContext) =>
      navigate(`/room/${context.roomId}`),
  };
  return createMachine<
    AuthMachineContext,
    AuthMachineEvent,
    AuthMachineTypestate
  >(
    {
      id: 'auth',
      initial: 'gettingClient',
      context: { client: null, error: null },
      states: {
        gettingClient: {
          invoke: {
            id: 'getClient',
            src: 'getClient',
            onDone: {
              target: 'loggedIn',
              actions: assign({
                client: (_context, event) => event.data.data,
              }),
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
                  actions: [
                    assign({
                      client: (_context, event) => event.data.data,
                    }),
                  ],
                },
                onError: {
                  target: 'failure',
                  actions: assign({
                    error: (_context, event) => event.data.message,
                  }),
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
          entry: [
            assign<AuthMachineContext, AuthMachineEvent>({
              error: null,
              client: (context) =>
                context.client
                  ? {
                      ...context.client,
                      room: {
                        ...context.client?.room,
                        ref: spawn(
                          createRoomMachine(
                            context.client?.room?.id ?? null
                          ).withConfig({ actions: navigateActions }),
                          'room'
                        ),
                      },
                    }
                  : null,
            }),
            send(
              (context) => ({
                type: 'JOIN_ROOM',
                roomId: context.client?.room.id ?? null,
              }),
              { to: 'room' }
            ),
          ],
        },
      },
    },
    {
      services: {
        getClient: () => client<Client>('auth/me/'),
        register: (_context, event) => {
          if (event.type !== 'REGISTER') throw Error('Invalid event type');
          return client<Client>('auth/session/', {
            data: { username: event.username },
          });
        },
      },
    }
  );
};

export default createAuthMachine;
