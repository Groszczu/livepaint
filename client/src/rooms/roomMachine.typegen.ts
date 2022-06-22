// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    navigateToHome:
      | 'INIT'
      | 'error.platform.joinRoom'
      | 'error.platform.createRoom'
      | 'error.platform.connect';
    assignRoomId: 'JOIN_ROOM';
    assignRoomIdFromResponse: 'done.invoke.joinRoom' | 'done.invoke.createRoom';
    assignErrorFromResponse:
      | 'error.platform.joinRoom'
      | 'error.platform.createRoom'
      | 'error.platform.connect';
    assignConnection: 'done.invoke.connect';
    drawPath: 'DRAW_PATH_MESSAGE';
    assignCanvasContext: 'CREATE_CONTEXT';
    setupCanvasContext: 'CREATE_CONTEXT';
    startDrawing: 'START_DRAWING';
    assignPointToCurrentPath: 'START_DRAWING' | 'DRAW_POINT';
    drawPoint: 'DRAW_POINT';
    emptyCurrentPath: 'done.invoke.sendUpdate';
    navigateToRoom: 'done.invoke.connect';
  };
  internalEvents: {
    'error.platform.joinRoom': {
      type: 'error.platform.joinRoom';
      data: unknown;
    };
    'error.platform.createRoom': {
      type: 'error.platform.createRoom';
      data: unknown;
    };
    'error.platform.connect': { type: 'error.platform.connect'; data: unknown };
    'done.invoke.joinRoom': {
      type: 'done.invoke.joinRoom';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.createRoom': {
      type: 'done.invoke.createRoom';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.connect': {
      type: 'done.invoke.connect';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.sendUpdate': {
      type: 'done.invoke.sendUpdate';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'xstate.init': { type: 'xstate.init' };
    'error.platform.sendUpdate': {
      type: 'error.platform.sendUpdate';
      data: unknown;
    };
  };
  invokeSrcNameMap: {
    joinRoom: 'done.invoke.joinRoom';
    createRoom: 'done.invoke.createRoom';
    connect: 'done.invoke.connect';
    sendUpdate: 'done.invoke.sendUpdate';
  };
  missingImplementations: {
    actions: 'navigateToHome' | 'navigateToRoom';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    connect: 'INIT' | 'done.invoke.joinRoom' | 'done.invoke.createRoom';
    joinRoom: 'JOIN_ROOM';
    createRoom: 'CREATE_ROOM';
    sendUpdate: 'STOP_DRAWING';
  };
  eventsCausingGuards: {
    alreadyJoined: 'INIT';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'idle'
    | 'joiningRoom'
    | 'creatingRoom'
    | 'connecting'
    | 'joinedRoom'
    | 'joinedRoom.waitingForContext'
    | 'joinedRoom.idle'
    | 'joinedRoom.drawing'
    | 'joinedRoom.sendingUpdate'
    | 'failedToJoinRoom'
    | {
        joinedRoom?: 'waitingForContext' | 'idle' | 'drawing' | 'sendingUpdate';
      };
  tags: never;
}
