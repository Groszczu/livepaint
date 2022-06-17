import { it, expect, vi } from 'vitest';
import { interpret } from 'xstate';

import type { APIResponse } from '../../api/client';
import { getMockService, wait } from '../../utils/testUtils';
import authMachine from '../authMachine';
import type { Client } from '../models';

function getAuthService() {
  const navigateMock = vi.fn();
  const mockGetClient = getMockService<APIResponse<Client>>();
  const mockRegister = getMockService<APIResponse<Client>>();
  const machine = authMachine(navigateMock).withConfig({
    services: {
      getClient: () => mockGetClient.service,
      register: () => mockRegister.service,
    },
  });
  const service = interpret(machine);

  return {
    service,
    getClient: mockGetClient,
    register: mockRegister,
    navigateMock,
  };
}

it('goes to loggedIn state if fetched client successfully', async () => {
  const { service, getClient } = getAuthService();
  let currentState = service.initialState;
  service
    .onTransition((nextState) => {
      currentState = nextState;
    })
    .start();

  const client = { username: 'Test user1', room: null };
  getClient.resolve({ data: client });

  await wait(0);

  expect(currentState.value).toBe('loggedIn');
  expect(currentState.context).toMatchObject({ client });
});

it('goes to loggedOut state if failed to fetch client', async () => {
  const { service, getClient } = getAuthService();
  let currentState = service.initialState;
  service
    .onTransition((nextState) => {
      currentState = nextState;
    })
    .start();

  getClient.reject('error');

  await wait(0);

  expect(currentState.value).toEqual({ loggedOut: 'idle' });
  expect(currentState.context).toMatchObject({ error: 'error' });
});

it('goes to loggedIn state if register is successful', async () => {
  const { service, getClient, register } = getAuthService();
  let currentState = service.initialState;
  service
    .onTransition((nextState) => {
      currentState = nextState;
    })
    .start();

  expect(currentState.value).toBe('gettingClient');

  getClient.reject('error');

  await wait(0);

  expect(currentState.value).toEqual({ loggedOut: 'idle' });

  service.send('REGISTER');

  const client = { username: 'Test user1', room: null };
  register.resolve({ data: client });

  await wait(0);

  expect(currentState.value).toEqual('loggedIn');
  expect(currentState.context).toMatchObject({ client });
});

it('goes to loggedOut state if register fails', async () => {
  const { service, getClient, register } = getAuthService();
  let currentState = service.initialState;
  service
    .onTransition((nextState) => {
      currentState = nextState;
    })
    .start();

  expect(currentState.value).toBe('gettingClient');

  getClient.reject('error');

  await wait(0);

  expect(currentState.value).toEqual({ loggedOut: 'idle' });

  service.send('REGISTER');

  register.reject('register error');

  await wait(0);

  expect(currentState.value).toEqual({ loggedOut: 'idle' });
  expect(currentState.context).toMatchObject({ error: 'register error' });
});
