import { ContentCopy } from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useSelector } from '@xstate/react';
import type { PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { StateFrom } from 'xstate';

import { WS_MESSAGE_TYPES } from '../api/websocket';
import type { AuthService } from '../auth/AuthServiceProvider';
import { useAuthService } from '../auth/AuthServiceProvider';
import type { RoomMachine } from '../rooms/roomMachine';

function roomSelector(state: AuthService['state']) {
  if (!state.context.roomRef) {
    throw new Error('Unexpected null room actor ref');
  }
  return state.context.roomRef;
}

function wsSelector(state: StateFrom<RoomMachine>) {
  return state.context.ws;
}

function RoomPage() {
  const { roomId } = useParams();
  const authService = useAuthService();
  const roomRef = useSelector(authService, roomSelector);
  const ws = useSelector(roomRef, wsSelector);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function getRelativePointerPosition(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('Canvas not initialized before drawing');
    }
    return {
      x: e.clientX - canvas.offsetLeft,
      y: e.clientY - canvas.offsetTop,
    };
  }

  useEffect(() => {
    if (!ws) {
      return;
    }

    function handleMessage(e: MessageEvent) {
      const [messageType, ...bytes] = new Uint8Array(e.data);
      switch (messageType) {
        case WS_MESSAGE_TYPES.DRAW_PATH: {
          roomRef.send({ type: 'DRAW_PATH_MESSAGE', bytes });

          break;
        }
        default:
          break;
      }
    }

    ws.addEventListener('message', handleMessage);

    return () => ws.removeEventListener('message', handleMessage);
  }, [roomRef, ws]);

  useEffect(() => {
    if (!canvasRef.current || !roomId) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const ctx = canvasRef.current.getContext('2d');

    if (!ctx) {
      return;
    }

    const subscription = roomRef.subscribe((state) => {
      if (state.matches('joinedRoom.waitingForContext')) {
        roomRef.send({
          type: 'CREATE_CONTEXT',
          canvasContext: ctx,
          canvasDimensions: { width: canvas.width, height: canvas.height },
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [roomId, roomRef]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      padding={2}
    >
      <Stack
        direction="row"
        gap={1}
        justifyContent="center"
        alignItems="center"
        width="100%"
        marginBottom={2}
      >
        <Typography variant="h5">Room: {roomId}</Typography>
        <IconButton onClick={() => navigator.clipboard.writeText(roomId ?? '')}>
          <ContentCopy />
        </IconButton>
        <Button
          color="warning"
          variant="outlined"
          onClick={() => roomRef.send('LEAVE_ROOM')}
          sx={{ marginLeft: 'auto' }}
        >
          Leave
        </Button>
      </Stack>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', width: '100%', flex: 1 }}
        onPointerDown={(e) => {
          roomRef.send({
            type: 'START_DRAWING',
            pointerPosition: getRelativePointerPosition(e),
          });
        }}
        onPointerUp={() => {
          roomRef.send('STOP_DRAWING');
        }}
        onPointerMove={(e) => {
          roomRef.send({
            type: 'DRAW_POINT',
            pointerPosition: getRelativePointerPosition(e),
          });
        }}
      />
    </Box>
  );
}

export default RoomPage;
