import { ContentCopy } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
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
    return {
      x: e.clientX - (canvas?.offsetLeft ?? 0),
      y: e.clientY - (canvas?.offsetTop ?? 0),
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
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight * 0.8;
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

    // if (!roomId) {
    //   return () => {
    //     subscription.unsubscribe();
    //   };
    // }

    // const persistedImageURL = localStorage.getItem(roomId);

    // if (!persistedImageURL) {
    //   return () => {
    //     subscription.unsubscribe();
    //   };
    // }
    // const img = new Image();
    // img.onload = () => {
    //   canvas.width = img.width;
    //   canvas.height = img.height;
    //   ctx.drawImage(img, 0, 0);
    // };

    // img.src = persistedImageURL;

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, roomRef]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Stack direction="row" gap={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h5">Room: {roomId}</Typography>
        <IconButton onClick={() => navigator.clipboard.writeText(roomId ?? '')}>
          <ContentCopy />
        </IconButton>
      </Stack>
      <canvas
        ref={canvasRef}
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
