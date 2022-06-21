// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    assignClientFromResponse: 'done.invoke.getClient' | 'done.invoke.register';
    assignErrorFromResponse: 'error.platform.register';
    spawnRoomActor: 'done.invoke.getClient' | 'done.invoke.register' | '';
    sendInitRoomEvent: 'done.invoke.getClient' | 'done.invoke.register' | '';
  };
  internalEvents: {
    'done.invoke.getClient': {
      type: 'done.invoke.getClient';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.register': {
      type: 'done.invoke.register';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.register': {
      type: 'error.platform.register';
      data: unknown;
    };
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
    'error.platform.getClient': {
      type: 'error.platform.getClient';
      data: unknown;
    };
  };
  invokeSrcNameMap: {
    getClient: 'done.invoke.getClient';
    register: 'done.invoke.register';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    getClient: 'xstate.init';
    register: 'REGISTER';
  };
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | 'gettingClient'
    | 'loggedOut'
    | 'loggedOut.idle'
    | 'loggedOut.registering'
    | 'loggedOut.success'
    | 'loggedOut.failure'
    | 'loggedIn'
    | { loggedOut?: 'idle' | 'registering' | 'success' | 'failure' };
  tags: never;
}
