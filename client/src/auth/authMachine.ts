import { assign, createMachine } from 'xstate';

import client from '../api/client';
import type { Client } from './models';

export interface AuthContext {
  client: Client | null;
  error: string | null;
}

export type AuthEvent =
  | { type: 'GET_CLIENT' }
  | { type: 'REGISTER'; username: string };

export type AuthTypestate =
  | {
      value: 'idle';
      context: AuthContext & { user: null; error: null };
    }
  | {
      value: 'gettingClient';
      context: AuthContext & { user: null; error: null };
    }
  | {
      value: 'loggedOut.idle';
      context: AuthContext & { user: null; error: null | string };
    }
  | {
      value: 'loggedOut.registering';
      context: AuthContext & { user: null; error: null };
    }
  | {
      value: 'loggedIn';
      context: AuthContext & { user: Client; error: null };
    };

const authMachine = createMachine<AuthContext, AuthEvent, AuthTypestate>(
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
            actions: assign({ error: (_context, event) => event.data }),
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
                target: 'success',
                actions: [
                  assign({
                    client: (_context, event) => event.data.data,
                  }),
                  'navigateToHome',
                ],
              },
              onError: {
                target: 'failure',
                actions: assign({
                  error: (_context, event) => event.data,
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

      loggedIn: { type: 'final' },
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
    actions: {
      navigateToHome: () => {},
    },
  }
);

export default authMachine;
